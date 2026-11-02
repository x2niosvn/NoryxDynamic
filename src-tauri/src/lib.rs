use serde::Serialize;
use std::sync::atomic::{AtomicBool, AtomicU32, AtomicU64, Ordering};
use std::sync::Arc;
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{Emitter, Manager, PhysicalPosition, PhysicalSize, Position};

static LAST_SETTINGS_CLOSE_MS: AtomicU64 = AtomicU64::new(0);
static CURRENT_BRIGHTNESS: AtomicU32 = AtomicU32::new(75);

#[derive(Serialize, Clone, Debug, Default)]
pub struct MediaTrackInfo {
    pub title: String,
    pub artist: String,
    pub album_title: String,
    pub is_playing: bool,
    pub source_app_id: String,
    pub position_seconds: f64,
    pub duration_seconds: f64,
    pub thumbnail_base64: Option<String>,
}

#[derive(Serialize, Clone, Debug, Default)]
pub struct BatteryStatusInfo {
    pub is_charging: bool,
    pub battery_percent: u8,
    pub has_battery: bool,
}

#[derive(Serialize, Clone, Debug, Default)]
pub struct HardwareAlertInfo {
    pub cpu_percent: u32,
    pub ram_percent: u32,
    pub ram_used_gb: f32,
}

#[derive(Serialize, Clone, Debug, Default)]
pub struct NetSpeedInfo {
    pub speed_text: String,
    pub is_active: bool,
}

struct AppState {
    pub is_expanded: Arc<AtomicBool>,
    pub island_width: Arc<AtomicU32>,
    pub island_height: Arc<AtomicU32>,
}

#[tauri::command]
fn update_island_bounds(state: tauri::State<AppState>, width: u32, height: u32, expanded: bool) {
    state.island_width.store(width, Ordering::Relaxed);
    state.island_height.store(height, Ordering::Relaxed);
    state.is_expanded.store(expanded, Ordering::Relaxed);
}

#[tauri::command]
fn launch_app(target: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;

        let cmd_arg = match target.as_str() {
            "explorer" => "start explorer",
            "terminal" => "start wt || start powershell",
            "chrome" => "start chrome || start msedge",
            "code" => "start code",
            "spotify" => "start spotify:",
            "settings" => "start ms-settings:",
            "calc" => "start calc",
            "notepad" => "start notepad",
            _ => "start explorer",
        };

        let mut cmd = std::process::Command::new("cmd");
        cmd.args(["/c", cmd_arg]);
        cmd.creation_flags(CREATE_NO_WINDOW);
        let _ = cmd.spawn();
    }
    Ok(())
}

#[cfg(target_os = "windows")]
fn get_system_volume_scalar() -> Option<f32> {
    use windows::Win32::Media::Audio::Endpoints::IAudioEndpointVolume;
    use windows::Win32::Media::Audio::{eMultimedia, eRender, IMMDeviceEnumerator, MMDeviceEnumerator};
    use windows::Win32::System::Com::{CoCreateInstance, CoInitializeEx, CLSCTX_ALL, COINIT_MULTITHREADED};

    unsafe {
        let _ = CoInitializeEx(None, COINIT_MULTITHREADED);
        let enumerator: IMMDeviceEnumerator = CoCreateInstance(&MMDeviceEnumerator, None, CLSCTX_ALL).ok()?;
        let device = enumerator.GetDefaultAudioEndpoint(eRender, eMultimedia).ok()?;
        let endpoint_volume: IAudioEndpointVolume = device.Activate(CLSCTX_ALL, None).ok()?;
        let level = endpoint_volume.GetMasterVolumeLevelScalar().ok()?;
        Some(level)
    }
}

#[cfg(target_os = "windows")]
#[tauri::command]
fn adjust_volume(delta: f32) -> Result<f32, String> {
    use windows::Win32::Media::Audio::Endpoints::IAudioEndpointVolume;
    use windows::Win32::Media::Audio::{eMultimedia, eRender, IMMDeviceEnumerator, MMDeviceEnumerator};
    use windows::Win32::System::Com::{CoCreateInstance, CoInitializeEx, CLSCTX_ALL, COINIT_MULTITHREADED};

    unsafe {
        let _ = CoInitializeEx(None, COINIT_MULTITHREADED);
        let enumerator: IMMDeviceEnumerator = CoCreateInstance(&MMDeviceEnumerator, None, CLSCTX_ALL).map_err(|e| e.to_string())?;
        let device = enumerator.GetDefaultAudioEndpoint(eRender, eMultimedia).map_err(|e| e.to_string())?;
        let endpoint_volume: IAudioEndpointVolume = device.Activate(CLSCTX_ALL, None).map_err(|e| e.to_string())?;
        let level = endpoint_volume.GetMasterVolumeLevelScalar().map_err(|e| e.to_string())?;
        let new_level = (level + delta).clamp(0.0, 1.0);
        endpoint_volume.SetMasterVolumeLevelScalar(new_level, std::ptr::null()).map_err(|e| e.to_string())?;
        Ok(new_level)
    }
}

#[cfg(not(target_os = "windows"))]
#[tauri::command]
fn adjust_volume(_delta: f32) -> Result<f32, String> {
    Ok(0.5)
}

#[tauri::command]
fn adjust_brightness(app: tauri::AppHandle, delta: f32) -> Result<u32, String> {
    let current = CURRENT_BRIGHTNESS.load(Ordering::Relaxed) as i32;
    let delta_int = (delta * 100.0).round() as i32;
    let new_val = (current + delta_int).clamp(0, 100) as u32;
    CURRENT_BRIGHTNESS.store(new_val, Ordering::Relaxed);

    #[cfg(target_os = "windows")]
    {
        std::thread::spawn(move || {
            use std::os::windows::process::CommandExt;
            let _ = std::process::Command::new("powershell")
                .args(["-NoProfile", "-Command", &format!("(Get-CimInstance -Namespace root/wmi -ClassName WmiMonitorBrightnessMethods).WmiSetBrightness(1, {})", new_val)])
                .creation_flags(0x08000000)
                .output();
        });
    }

    let _ = app.emit("system-brightness-changed", new_val);
    Ok(new_val)
}

#[tauri::command]
fn get_brightness() -> u32 {
    CURRENT_BRIGHTNESS.load(Ordering::Relaxed)
}

#[cfg(target_os = "windows")]
#[tauri::command]
fn get_battery_status() -> BatteryStatusInfo {
    use windows::Win32::System::Power::{GetSystemPowerStatus, SYSTEM_POWER_STATUS};
    let mut status = SYSTEM_POWER_STATUS::default();
    unsafe {
        if GetSystemPowerStatus(&mut status).is_ok() {
            let is_charging = status.ACLineStatus == 1;
            let battery_percent = if status.BatteryLifePercent <= 100 {
                status.BatteryLifePercent
            } else {
                100
            };
            let has_battery = status.BatteryFlag != 128 && status.BatteryLifePercent != 255;
            return BatteryStatusInfo {
                is_charging,
                battery_percent,
                has_battery,
            };
        }
    }
    BatteryStatusInfo::default()
}

#[cfg(not(target_os = "windows"))]
#[tauri::command]
fn get_battery_status() -> BatteryStatusInfo {
    BatteryStatusInfo::default()
}

#[cfg(target_os = "windows")]
#[tauri::command]
fn read_clipboard_text() -> Result<Option<String>, String> {
    use windows::Win32::System::DataExchange::{OpenClipboard, CloseClipboard, GetClipboardData};
    use windows::Win32::System::Memory::{GlobalLock, GlobalUnlock};
    use windows::Win32::Foundation::{HWND, HGLOBAL};

    unsafe {
        if OpenClipboard(HWND::default()).is_ok() {
            // CF_UNICODETEXT = 13
            let handle = GetClipboardData(13);
            let text = if let Ok(h) = handle {
                if !h.0.is_null() {
                    let hglobal = HGLOBAL(h.0);
                    let ptr = GlobalLock(hglobal);
                    if !ptr.is_null() {
                        let wide_ptr = ptr as *const u16;
                        let mut len = 0;
                        while *wide_ptr.add(len) != 0 {
                            len += 1;
                        }
                        let slice = std::slice::from_raw_parts(wide_ptr, len);
                        let s = String::from_utf16_lossy(slice);
                        let _ = GlobalUnlock(hglobal);
                        Some(s)
                    } else {
                        None
                    }
                } else {
                    None
                }
            } else {
                None
            };
            let _ = CloseClipboard();
            return Ok(text);
        }
    }
    Ok(None)
}

#[cfg(not(target_os = "windows"))]
#[tauri::command]
fn read_clipboard_text() -> Result<Option<String>, String> {
    Ok(None)
}

#[cfg(target_os = "windows")]
#[tauri::command]
fn write_clipboard_text(text: String) -> Result<bool, String> {
    use windows::Win32::System::DataExchange::{OpenClipboard, CloseClipboard, EmptyClipboard, SetClipboardData};
    use windows::Win32::System::Memory::{GlobalAlloc, GlobalLock, GlobalUnlock, GMEM_MOVEABLE};
    use windows::Win32::Foundation::{HWND, HANDLE, HGLOBAL};

    let utf16: Vec<u16> = text.encode_utf16().chain(std::iter::once(0)).collect();
    let bytes_len = utf16.len() * 2;

    unsafe {
        if OpenClipboard(HWND::default()).is_ok() {
            let _ = EmptyClipboard();
            if let Ok(hmem) = GlobalAlloc(GMEM_MOVEABLE, bytes_len) {
                let hglobal = HGLOBAL(hmem.0);
                let ptr = GlobalLock(hglobal);
                if !ptr.is_null() {
                    std::ptr::copy_nonoverlapping(utf16.as_ptr() as *const u8, ptr as *mut u8, bytes_len);
                    let _ = GlobalUnlock(hglobal);
                    let _ = SetClipboardData(13, HANDLE(hmem.0));
                }
            }
            let _ = CloseClipboard();
            return Ok(true);
        }
    }
    Ok(false)
}

#[cfg(target_os = "windows")]
fn read_clipboard_image_native() -> Option<String> {
    use windows::Win32::System::DataExchange::{OpenClipboard, CloseClipboard, GetClipboardData, IsClipboardFormatAvailable};
    use windows::Win32::System::Memory::{GlobalLock, GlobalUnlock, GlobalSize};
    use windows::Win32::Foundation::{HWND, HGLOBAL};

    unsafe {
        // CF_DIB = 8
        if IsClipboardFormatAvailable(8).is_ok() {
            if OpenClipboard(HWND::default()).is_ok() {
                let handle = GetClipboardData(8);
                let result = if let Ok(h) = handle {
                    if !h.0.is_null() {
                        let hglobal = HGLOBAL(h.0);
                        let ptr = GlobalLock(hglobal);
                        let dib_len = GlobalSize(hglobal);
                        if !ptr.is_null() && dib_len > 40 && dib_len < 25_000_000 {
                            let dib_slice = std::slice::from_raw_parts(ptr as *const u8, dib_len);

                            let bi_size = u32::from_le_bytes([dib_slice[0], dib_slice[1], dib_slice[2], dib_slice[3]]);
                            let bi_bit_count = if dib_len > 15 {
                                u16::from_le_bytes([dib_slice[14], dib_slice[15]])
                            } else {
                                24
                            };
                            let bi_clr_used = if dib_len > 35 {
                                u32::from_le_bytes([dib_slice[32], dib_slice[33], dib_slice[34], dib_slice[35]])
                            } else {
                                0
                            };

                            let palette_size = if bi_clr_used > 0 {
                                bi_clr_used * 4
                            } else if bi_bit_count <= 8 {
                                (1 << bi_bit_count) * 4
                            } else {
                                0
                            };

                            let off_bits = 14 + bi_size + palette_size;
                            let file_size = 14 + dib_len as u32;

                            let mut bmp_bytes = Vec::with_capacity(14 + dib_len);
                            bmp_bytes.extend_from_slice(&0x4D42u16.to_le_bytes()); // "BM"
                            bmp_bytes.extend_from_slice(&file_size.to_le_bytes());
                            bmp_bytes.extend_from_slice(&0u32.to_le_bytes());
                            bmp_bytes.extend_from_slice(&off_bits.to_le_bytes());
                            bmp_bytes.extend_from_slice(dib_slice);

                            let _ = GlobalUnlock(hglobal);

                            use base64::Engine;
                            let encoded = base64::engine::general_purpose::STANDARD.encode(&bmp_bytes);
                            Some(format!("data:image/bmp;base64,{}", encoded))
                        } else {
                            if !ptr.is_null() {
                                let _ = GlobalUnlock(hglobal);
                            }
                            None
                        }
                    } else {
                        None
                    }
                } else {
                    None
                };
                let _ = CloseClipboard();
                return result;
            }
        }
    }
    None
}

#[cfg(not(target_os = "windows"))]
fn read_clipboard_image_native() -> Option<String> {
    None
}

#[cfg(target_os = "windows")]
fn is_foreground_fullscreen(main_hwnd_opt: Option<isize>, settings_hwnd_opt: Option<isize>) -> bool {
    use windows::Win32::UI::WindowsAndMessaging::{
        GetForegroundWindow, GetWindowRect, GetDesktopWindow, GetShellWindow, IsIconic, GetClassNameW, GetWindowTextW
    };
    use windows::Win32::Graphics::Gdi::{
        MonitorFromWindow, GetMonitorInfoW, MONITOR_DEFAULTTONEAREST, MONITORINFO
    };
    use windows::Win32::Foundation::{RECT, HWND};

    unsafe {
        let fg = GetForegroundWindow();
        if fg == HWND::default() || fg == GetDesktopWindow() || fg == GetShellWindow() {
            return false;
        }

        if let Some(main_hwnd) = main_hwnd_opt {
            if fg.0 as isize == main_hwnd {
                return false;
            }
        }
        if let Some(settings_hwnd) = settings_hwnd_opt {
            if fg.0 as isize == settings_hwnd {
                return false;
            }
        }

        if IsIconic(fg).as_bool() {
            return false;
        }

        // Bỏ qua Desktop (WorkerW, Progman) và Taskbar hệ thống
        let mut class_buf = [0u16; 256];
        let class_len = GetClassNameW(fg, &mut class_buf);
        if class_len > 0 {
            let class_str = String::from_utf16_lossy(&class_buf[..class_len as usize]);
            if class_str == "Progman"
                || class_str == "WorkerW"
                || class_str == "Shell_TrayWnd"
                || class_str == "Shell_SecondaryTrayWnd"
                || class_str == "Windows.UI.Core.CoreWindow"
            {
                return false;
            }
        }

        // Bỏ qua cửa sổ Program Manager của Windows
        let mut title_buf = [0u16; 256];
        let title_len = GetWindowTextW(fg, &mut title_buf);
        if title_len > 0 {
            let title_str = String::from_utf16_lossy(&title_buf[..title_len as usize]);
            if title_str == "Program Manager" {
                return false;
            }
        }

        let mut rect = RECT::default();
        if GetWindowRect(fg, &mut rect).is_err() {
            return false;
        }

        let monitor = MonitorFromWindow(fg, MONITOR_DEFAULTTONEAREST);
        let mut mi = MONITORINFO::default();
        mi.cbSize = std::mem::size_of::<MONITORINFO>() as u32;
        if GetMonitorInfoW(monitor, &mut mi).as_bool() {
            let width = (rect.right - rect.left).abs();
            let height = (rect.bottom - rect.top).abs();
            let mon_width = (mi.rcMonitor.right - mi.rcMonitor.left).abs();
            let mon_height = (mi.rcMonitor.bottom - mi.rcMonitor.top).abs();

            return width >= mon_width && height >= mon_height && rect.left <= mi.rcMonitor.left && rect.top <= mi.rcMonitor.top;
        }
    }
    false
}

#[cfg(not(target_os = "windows"))]
fn is_foreground_fullscreen(_main_hwnd_opt: Option<isize>, _settings_hwnd_opt: Option<isize>) -> bool {
    false
}

#[cfg(not(target_os = "windows"))]
#[tauri::command]
fn write_clipboard_text(_text: String) -> Result<bool, String> {
    Ok(false)
}

#[cfg(target_os = "windows")]
fn is_autostart_enabled() -> bool {
    use std::os::windows::process::CommandExt;
    let output = std::process::Command::new("reg")
        .args(["query", "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run", "/v", "NoryxDynamicIsland"])
        .creation_flags(0x08000000)
        .output();
    if let Ok(out) = output {
        out.status.success()
    } else {
        false
    }
}

#[cfg(not(target_os = "windows"))]
fn is_autostart_enabled() -> bool {
    false
}

#[cfg(target_os = "windows")]
#[tauri::command]
fn get_autostart_status() -> Result<bool, String> {
    Ok(is_autostart_enabled())
}

#[cfg(not(target_os = "windows"))]
#[tauri::command]
fn get_autostart_status() -> Result<bool, String> {
    Ok(false)
}

#[cfg(target_os = "windows")]
#[tauri::command]
fn toggle_autostart() -> Result<bool, String> {
    use std::os::windows::process::CommandExt;
    let current = is_autostart_enabled();
    if current {
        let _ = std::process::Command::new("reg")
            .args(["delete", "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run", "/v", "NoryxDynamicIsland", "/f"])
            .creation_flags(0x08000000)
            .output();
        Ok(false)
    } else {
        if let Ok(exe_path) = std::env::current_exe() {
            let path_str = exe_path.to_string_lossy().to_string();
            // Nếu đang chạy từ target\debug trong quá trình dev, tự động trỏ đến bản release portable
            let final_path = if path_str.to_lowercase().contains(r"\target\debug\") {
                let release_candidate = exe_path.ancestors().nth(3).map(|p| p.join(r"release\Noryx_Dynamic_Island_Portable.exe"));
                if let Some(ref r) = release_candidate {
                    if r.exists() {
                        r.to_string_lossy().to_string()
                    } else {
                        path_str
                    }
                } else {
                    path_str
                }
            } else {
                path_str
            };

            let _ = std::process::Command::new("reg")
                .args(["add", "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run", "/v", "NoryxDynamicIsland", "/t", "REG_SZ", "/d", &format!("\"{}\"", final_path), "/f"])
                .creation_flags(0x08000000)
                .output();
        }
        Ok(true)
    }
}

#[cfg(not(target_os = "windows"))]
#[tauri::command]
fn toggle_autostart() -> Result<bool, String> {
    Ok(false)
}

#[tauri::command]
fn toggle_main_window(app: tauri::AppHandle) -> Result<bool, String> {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_visible().unwrap_or(true) {
            let _ = window.hide();
            return Ok(false);
        } else {
            let _ = window.show();
            let _ = window.set_focus();
            return Ok(true);
        }
    }
    Ok(false)
}

#[tauri::command]
fn is_main_window_visible(app: tauri::AppHandle) -> Result<bool, String> {
    if let Some(window) = app.get_webview_window("main") {
        return Ok(window.is_visible().unwrap_or(true));
    }
    Ok(true)
}

#[tauri::command]
fn close_settings_window(app: tauri::AppHandle) -> Result<(), String> {
    use std::time::{SystemTime, UNIX_EPOCH};
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis() as u64;
    LAST_SETTINGS_CLOSE_MS.store(now, Ordering::Relaxed);

    if let Some(settings_win) = app.get_webview_window("settings") {
        let _ = settings_win.hide();
    }
    Ok(())
}

#[tauri::command]
fn exit_app(app: tauri::AppHandle) {
    app.exit(0);
}

#[tauri::command]
fn set_ignore_cursor_events(app: tauri::AppHandle, ignore: bool) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.set_ignore_cursor_events(ignore).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[cfg(target_os = "windows")]
#[tauri::command]
async fn get_current_media() -> Result<Option<MediaTrackInfo>, String> {
    use windows::Media::Control::GlobalSystemMediaTransportControlsSessionManager;

    let manager = match GlobalSystemMediaTransportControlsSessionManager::RequestAsync() {
        Ok(async_op) => match async_op.get() {
            Ok(m) => m,
            Err(_) => return Ok(None),
        },
        Err(_) => return Ok(None),
    };

    if let Ok(session) = manager.GetCurrentSession() {
        let mut info = MediaTrackInfo::default();

        if let Ok(source) = session.SourceAppUserModelId() {
            info.source_app_id = source.to_string();
        }

        if let Ok(playback) = session.GetPlaybackInfo() {
            if let Ok(status) = playback.PlaybackStatus() {
                info.is_playing = status.0 == 4;
            }
        }

        if let Ok(timeline) = session.GetTimelineProperties() {
            if let Ok(pos) = timeline.Position() {
                info.position_seconds = (pos.Duration / 10_000_000) as f64;
            }
            if let Ok(end) = timeline.EndTime() {
                info.duration_seconds = (end.Duration / 10_000_000) as f64;
            }
        }

        if let Ok(media_props_op) = session.TryGetMediaPropertiesAsync() {
            if let Ok(props) = media_props_op.get() {
                info.title = props.Title().unwrap_or_default().to_string();
                info.artist = props.Artist().unwrap_or_default().to_string();
                info.album_title = props.AlbumTitle().unwrap_or_default().to_string();

                if let Ok(thumbnail_ref) = props.Thumbnail() {
                    if let Ok(stream_op) = thumbnail_ref.OpenReadAsync() {
                        if let Ok(stream) = stream_op.get() {
                            if let Ok(size) = stream.Size() {
                                if size > 0 && size < 8_000_000 {
                                    use windows::Storage::Streams::DataReader;
                                    if let Ok(reader) = DataReader::CreateDataReader(&stream) {
                                        if let Ok(load_op) = reader.LoadAsync(size as u32) {
                                            if load_op.get().is_ok() {
                                                let mut bytes = vec![0u8; size as usize];
                                                if reader.ReadBytes(&mut bytes).is_ok() {
                                                    use base64::Engine;
                                                    let encoded = base64::engine::general_purpose::STANDARD.encode(&bytes);
                                                    info.thumbnail_base64 = Some(format!("data:image/jpeg;base64,{}", encoded));
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        if !info.title.trim().is_empty() {
            return Ok(Some(info));
        }
    }

    Ok(None)
}

#[cfg(not(target_os = "windows"))]
#[tauri::command]
async fn get_current_media() -> Result<Option<MediaTrackInfo>, String> {
    Ok(None)
}

#[cfg(target_os = "windows")]
#[tauri::command]
async fn media_play_pause() -> Result<bool, String> {
    use windows::Media::Control::GlobalSystemMediaTransportControlsSessionManager;

    if let Ok(manager_op) = GlobalSystemMediaTransportControlsSessionManager::RequestAsync() {
        if let Ok(manager) = manager_op.get() {
            if let Ok(session) = manager.GetCurrentSession() {
                let _ = session.TryTogglePlayPauseAsync();
                return Ok(true);
            }
        }
    }
    Ok(false)
}

#[cfg(not(target_os = "windows"))]
#[tauri::command]
async fn media_play_pause() -> Result<bool, String> {
    Ok(false)
}

#[cfg(target_os = "windows")]
#[tauri::command]
async fn media_next() -> Result<bool, String> {
    use windows::Media::Control::GlobalSystemMediaTransportControlsSessionManager;

    if let Ok(manager_op) = GlobalSystemMediaTransportControlsSessionManager::RequestAsync() {
        if let Ok(manager) = manager_op.get() {
            if let Ok(session) = manager.GetCurrentSession() {
                let _ = session.TrySkipNextAsync();
                return Ok(true);
            }
        }
    }
    Ok(false)
}

#[cfg(not(target_os = "windows"))]
#[tauri::command]
async fn media_next() -> Result<bool, String> {
    Ok(false)
}

#[cfg(target_os = "windows")]
#[tauri::command]
async fn media_previous() -> Result<bool, String> {
    use windows::Media::Control::GlobalSystemMediaTransportControlsSessionManager;

    if let Ok(manager_op) = GlobalSystemMediaTransportControlsSessionManager::RequestAsync() {
        if let Ok(manager) = manager_op.get() {
            if let Ok(session) = manager.GetCurrentSession() {
                let _ = session.TrySkipPreviousAsync();
                return Ok(true);
            }
        }
    }
    Ok(false)
}

#[cfg(not(target_os = "windows"))]
#[tauri::command]
async fn media_previous() -> Result<bool, String> {
    Ok(false)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let is_expanded = Arc::new(AtomicBool::new(false));
    let island_width = Arc::new(AtomicU32::new(100));
    let island_height = Arc::new(AtomicU32::new(32));

    let is_expanded_for_thread = is_expanded.clone();
    let width_for_thread = island_width.clone();
    let height_for_thread = island_height.clone();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            is_expanded,
            island_width,
            island_height,
        })
        .setup(move |app| {
            let handle = app.handle().clone();

            if let Some(window) = app.get_webview_window("main") {
                if let Ok(Some(monitor)) = window.primary_monitor() {
                    let screen_size = monitor.size();
                    let window_size = window
                        .outer_size()
                        .unwrap_or(PhysicalSize { width: 640, height: 320 });
                    let x = (screen_size.width as i32 - window_size.width as i32) / 2;
                    let _ = window.set_position(Position::Physical(PhysicalPosition { x, y: 0 }));
                }

                let _ = window.set_always_on_top(true);
            }

            // Icon khay hệ thống (Taskbar Tray Icon): Bấm vào mở menu Settings tối giản ở góc dưới bên phải
            if let Some(default_icon) = app.default_window_icon() {
                let _tray = TrayIconBuilder::new()
                    .icon(default_icon.clone())
                    .tooltip("Noryx Dynamic Island")
                    .on_tray_icon_event(|tray, event| {
                        if let TrayIconEvent::Click {
                            button: MouseButton::Left | MouseButton::Right,
                            button_state: MouseButtonState::Up,
                            ..
                        } = event
                        {
                            use std::time::{SystemTime, UNIX_EPOCH};
                            let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis() as u64;
                            let last_close = LAST_SETTINGS_CLOSE_MS.load(Ordering::Relaxed);

                            // Nếu vừa mới bị ẩn do blur (mất focus khi click) trong vòng 350ms thì bỏ qua, không mở lại
                            if now.saturating_sub(last_close) < 350 {
                                return;
                            }

                            let app = tray.app_handle();
                            if let Some(settings_win) = app.get_webview_window("settings") {
                                if settings_win.is_visible().unwrap_or(false) {
                                    LAST_SETTINGS_CLOSE_MS.store(now, Ordering::Relaxed);
                                    let _ = settings_win.hide();
                                } else {
                                    if let Ok(Some(monitor)) = settings_win.primary_monitor() {
                                        let screen = monitor.size();
                                        let scale = monitor.scale_factor();
                                        let win_w = 290.0 * scale;
                                        let win_h = 375.0 * scale;
                                        let x = (screen.width as f64 - win_w - (16.0 * scale)) as i32;
                                        let y = (screen.height as f64 - win_h - (54.0 * scale)) as i32;
                                        let _ = settings_win.set_position(Position::Physical(PhysicalPosition { x, y }));
                                    }
                                    let _ = settings_win.show();
                                    let _ = settings_win.set_focus();
                                }
                            }
                        }
                    })
                    .build(app)?;
            }

            // Luồng thông minh kiểm tra tọa độ con trỏ chuột, âm lượng, CapsLock, Pin & Clipboard
            #[cfg(target_os = "windows")]
            {
                use windows::Win32::Foundation::POINT;
                use windows::Win32::UI::WindowsAndMessaging::GetCursorPos;
                use windows::Win32::UI::Input::KeyboardAndMouse::GetKeyState;
                use windows::Win32::System::DataExchange::GetClipboardSequenceNumber;

                let handle_monitor = handle.clone();
                std::thread::spawn(move || {
                    let mut last_vol: Option<f32> = None;
                    let mut last_caps: Option<bool> = None;
                    let mut last_charging: Option<bool> = None;
                    let mut last_clip_seq = unsafe { GetClipboardSequenceNumber() };

                    loop {
                        std::thread::sleep(std::time::Duration::from_millis(120));

                        // 1. Kiểm tra Âm lượng thay đổi
                        if let Some(current_vol) = get_system_volume_scalar() {
                            if let Some(prev) = last_vol {
                                if (current_vol - prev).abs() > 0.015 {
                                    let percent = (current_vol * 100.0).round() as u32;
                                    let _ = handle_monitor.emit("system-volume-changed", percent);
                                }
                            }
                            last_vol = Some(current_vol);
                        }

                        // 2. Kiểm tra Caps Lock (VK_CAPITAL = 0x14)
                        let is_caps = unsafe { (GetKeyState(0x14) & 1) != 0 };
                        if let Some(prev_caps) = last_caps {
                            if is_caps != prev_caps {
                                let _ = handle_monitor.emit("caps-lock-changed", is_caps);
                            }
                        }
                        last_caps = Some(is_caps);

                        // 3. Kiểm tra Trạng thái Cắm Sạc / Pin MagSafe
                        let bat = get_battery_status();
                        if bat.has_battery {
                            if let Some(prev_c) = last_charging {
                                if bat.is_charging != prev_c {
                                    let _ = handle_monitor.emit("battery-status-changed", &bat);
                                }
                            }
                            last_charging = Some(bat.is_charging);
                        }

                        // 4. Kiểm tra Clipboard Sequence Number (Ctrl+C copy hoặc Win+Shift+S chụp ảnh)
                        let current_seq = unsafe { GetClipboardSequenceNumber() };
                        if current_seq != last_clip_seq {
                            last_clip_seq = current_seq;
                            std::thread::sleep(std::time::Duration::from_millis(50));

                            // Ưu tiên kiểm tra ảnh chụp màn hình
                            if let Some(img_data_url) = read_clipboard_image_native() {
                                let _ = handle_monitor.emit("screenshot-captured", img_data_url);
                            } else {
                                let mut text_opt = None;
                                for _ in 0..3 {
                                    if let Ok(Some(text)) = read_clipboard_text() {
                                        text_opt = Some(text);
                                        break;
                                    }
                                    std::thread::sleep(std::time::Duration::from_millis(40));
                                }

                                if let Some(text) = text_opt {
                                    let trimmed = text.trim();
                                    if !trimmed.is_empty() {
                                        let _ = handle_monitor.emit("clipboard-copied", trimmed.to_string());
                                    }
                                }
                            }
                        }
                    }
                });

                let handle_cursor = handle.clone();
                std::thread::spawn(move || {
                    let mut is_currently_ignoring = false;

                    loop {
                        std::thread::sleep(std::time::Duration::from_millis(25));

                        if let Some(window) = handle_cursor.get_webview_window("main") {
                            if let Ok(pos) = window.outer_position() {
                                let scale_factor = window.scale_factor().unwrap_or(1.0);
                                let mut pt = POINT::default();
                                unsafe {
                                    let _ = GetCursorPos(&mut pt);
                                }

                                let expanded = is_expanded_for_thread.load(Ordering::Relaxed);
                                let w_logical = width_for_thread.load(Ordering::Relaxed) as f64;
                                let h_logical = height_for_thread.load(Ordering::Relaxed) as f64;

                                let x_offset_logical = (640.0 - w_logical) / 2.0;
                                let y_offset_logical = 8.0;

                                let min_x = pos.x + (x_offset_logical * scale_factor) as i32;
                                let max_x = min_x + (w_logical * scale_factor) as i32;
                                let min_y = pos.y + (y_offset_logical * scale_factor) as i32;
                                let max_y = min_y + (h_logical * scale_factor) as i32;

                                let is_inside = pt.x >= min_x && pt.x <= max_x && pt.y >= min_y && pt.y <= max_y;

                                if is_inside && is_currently_ignoring {
                                    let _ = window.set_ignore_cursor_events(false);
                                    is_currently_ignoring = false;
                                } else if !is_inside && !is_currently_ignoring && !expanded {
                                    let _ = window.set_ignore_cursor_events(true);
                                    is_currently_ignoring = true;
                                }
                            }
                        }
                    }
                });

                // Luồng giám sát hệ thống: Quá tải CPU/RAM, Tốc độ mạng Live Net Speed, Tự ẩn Fullscreen
                let handle_sys = handle.clone();
                std::thread::spawn(move || {
                    let mut sys = sysinfo::System::new_all();
                    let mut networks = sysinfo::Networks::new_with_refreshed_list();
                    let mut last_alert_instant = std::time::Instant::now() - std::time::Duration::from_secs(60);
                    let mut last_fullscreen = false;
                    let mut tick = 0u32;

                    std::thread::sleep(std::time::Duration::from_millis(600));

                    loop {
                        std::thread::sleep(std::time::Duration::from_millis(500));
                        tick += 1;

                        // 1. Kiểm tra trạng thái chơi game / xem phim full screen để tự ẩn đảo
                        let main_hwnd = handle_sys.get_webview_window("main").and_then(|w| w.hwnd().ok().map(|h| h.0 as isize));
                        let settings_hwnd = handle_sys.get_webview_window("settings").and_then(|w| w.hwnd().ok().map(|h| h.0 as isize));
                        let is_fs = is_foreground_fullscreen(main_hwnd, settings_hwnd);
                        if is_fs != last_fullscreen {
                            last_fullscreen = is_fs;
                            let _ = handle_sys.emit("fullscreen-changed", is_fs);
                        }

                        // 2. Đo tốc độ mạng Live Net Speed (mỗi 1 giây = 2 ticks)
                        if tick % 2 == 0 {
                            networks.refresh(true);
                            let mut total_received_bytes = 0u64;
                            for (_name, net_data) in networks.iter() {
                                total_received_bytes += net_data.received();
                            }

                            if total_received_bytes >= 120 * 1024 {
                                let speed_str = if total_received_bytes >= 1024 * 1024 {
                                    format!("{:.1} MB/s", total_received_bytes as f64 / 1_048_576.0)
                                } else {
                                    format!("{:.0} KB/s", total_received_bytes as f64 / 1024.0)
                                };
                                let _ = handle_sys.emit("net-speed", NetSpeedInfo {
                                    speed_text: speed_str,
                                    is_active: true,
                                });
                            } else {
                                let _ = handle_sys.emit("net-speed", NetSpeedInfo {
                                    speed_text: String::new(),
                                    is_active: false,
                                });
                            }
                        }

                        // 3. Cảnh báo quá tải CPU / RAM > 90%
                        if tick % 3 == 0 {
                            sys.refresh_cpu_usage();
                            sys.refresh_memory();

                            let cpu_usage = sys.global_cpu_usage();
                            let total_ram = sys.total_memory();
                            let used_ram = sys.used_memory();
                            let ram_percent = if total_ram > 0 {
                                (used_ram as f64 / total_ram as f64 * 100.0) as u32
                            } else {
                                0
                            };
                            let cpu_percent = cpu_usage.round() as u32;

                            if (cpu_percent >= 90 || ram_percent >= 90) && last_alert_instant.elapsed().as_secs() > 30 {
                                last_alert_instant = std::time::Instant::now();
                                let ram_used_gb = (used_ram as f64 / (1024.0 * 1024.0 * 1024.0)) as f32;
                                let _ = handle_sys.emit("hardware-alert", HardwareAlertInfo {
                                    cpu_percent,
                                    ram_percent,
                                    ram_used_gb,
                                });
                            }
                        }
                    }
                });
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            update_island_bounds,
            set_ignore_cursor_events,
            get_current_media,
            media_play_pause,
            media_next,
            media_previous,
            launch_app,
            adjust_volume,
            adjust_brightness,
            get_brightness,
            get_battery_status,
            read_clipboard_text,
            write_clipboard_text,
            get_autostart_status,
            toggle_autostart,
            toggle_main_window,
            is_main_window_visible,
            close_settings_window,
            exit_app,
        ])
        .run(tauri::generate_context!())
        .expect("error while running noryx dynamic island");
}
