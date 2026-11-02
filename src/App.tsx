import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Music2,
  Volume2,
  VolumeX,
  Headphones,
  UploadCloud,
  SunMedium,
  Zap,
  Copy,
  ArrowUpSquare,
  Cpu,
  Camera,
  ArrowDown,
} from "lucide-react";

interface MediaTrack {
  title: string;
  artist: string;
  album_title: string;
  is_playing: boolean;
  source_app_id: string;
  position_seconds: number;
  duration_seconds: number;
  thumbnail_base64?: string | null;
}

interface BatteryStatus {
  is_charging: boolean;
  battery_percent: number;
  has_battery: boolean;
}

interface HardwareAlert {
  cpu_percent: number;
  ram_percent: number;
  ram_used_gb: number;
}

interface NetSpeed {
  speed_text: string;
  is_active: boolean;
}

const springConfig = {
  type: "spring" as const,
  stiffness: 460,
  damping: 32,
  mass: 0.7,
};

/* ========================================================================== */
/* BỘ ICON CHUẨN WINDOWS 11 FLUENT DESIGN                                    */
/* ========================================================================== */
const FluentFileExplorer = () => (
  <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
    <path d="M4 12C4 9.79086 5.79086 8 8 8H18L22 13H40C42.2091 13 44 14.7909 44 17V36C44 38.2091 42.2091 40 40 40H8C5.79086 40 4 38.2091 4 36V12Z" fill="#FFA000"/>
    <path d="M4 18C4 15.7909 5.79086 14 8 14H40C42.2091 14 44 15.7909 44 18V36C44 38.2091 42.2091 40 40 40H8C5.79086 40 4 38.2091 4 36V18Z" fill="#FFCA28"/>
    <rect x="2" y="20" width="44" height="20" rx="3" fill="#0288D1"/>
  </svg>
);

const FluentBrowser = () => (
  <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="20" fill="#0078D7"/>
    <path d="M24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44C35.0457 44 44 35.0457 44 24" stroke="#00C7FD" strokeWidth="6" strokeLinecap="round"/>
    <circle cx="24" cy="24" r="9" fill="#29B6F6"/>
  </svg>
);

const FluentVSCode = () => (
  <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
    <path d="M35.6 4.3L23.4 15.5L13.8 8.1L4.8 12.6V35.4L13.8 39.9L23.4 32.5L35.6 43.7C37.2 45.1 39.6 44.5 40.5 42.6L44.8 33.3C45.3 32.2 45.3 30.9 44.8 29.8L35.6 4.3Z" fill="#007ACC"/>
    <path d="M35.6 4.3L13.8 24L35.6 43.7V4.3Z" fill="#1F9CF0"/>
    <path d="M13.8 8.1L4.8 12.6V35.4L13.8 39.9L23.4 24L13.8 8.1Z" fill="#0065A9"/>
  </svg>
);

const FluentTerminal = () => (
  <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
    <rect x="4" y="8" width="40" height="32" rx="6" fill="#1E1E1E"/>
    <path d="M14 18L21 24L14 30" stroke="#4AF626" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M25 30H34" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round"/>
  </svg>
);

const FluentSpotify = () => (
  <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="20" fill="#1ED760"/>
    <path d="M14 19C20 17 28 17.5 33 20" stroke="#000000" strokeWidth="3.2" strokeLinecap="round"/>
    <path d="M15 24C20 22.5 27 23 31 25" stroke="#000000" strokeWidth="2.8" strokeLinecap="round"/>
    <path d="M16 29C20 28 25 28.5 29 30" stroke="#000000" strokeWidth="2.4" strokeLinecap="round"/>
  </svg>
);

const FluentSettings = () => (
  <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="18" fill="#5C6BC0"/>
    <circle cx="24" cy="24" r="8" fill="#1A237E"/>
    <path d="M24 2V6M24 42V46M2 24H6M42 24H46M8.4 8.4L11.2 11.2M36.8 36.8L39.6 39.6M8.4 39.6L11.2 36.8M36.8 11.2L39.6 8.4" stroke="#C5CAE9" strokeWidth="3.5" strokeLinecap="round"/>
  </svg>
);

const FluentCalculator = () => (
  <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
    <rect x="8" y="4" width="32" height="40" rx="6" fill="#0078D7"/>
    <rect x="13" y="9" width="22" height="8" rx="2" fill="#E1F5FE"/>
    <circle cx="16" cy="24" r="2.5" fill="#FFFFFF"/>
    <circle cx="24" cy="24" r="2.5" fill="#FFFFFF"/>
    <circle cx="32" cy="24" r="2.5" fill="#FFFFFF"/>
    <circle cx="16" cy="32" r="2.5" fill="#FFFFFF"/>
    <circle cx="24" cy="32" r="2.5" fill="#FFFFFF"/>
    <circle cx="32" cy="32" r="2.5" fill="#FFB900"/>
  </svg>
);

const FluentNotepad = () => (
  <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
    <rect x="8" y="6" width="32" height="36" rx="4" fill="#0078D4"/>
    <path d="M14 14H34M14 20H34M14 26H26" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="35" cy="35" r="7" fill="#00B294"/>
    <path d="M33 37L37 33" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const YoutubeIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#ffffff">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

function MarqueeText({ text, maxWidth = 130 }: { text: string; maxWidth?: number }) {
  const isLong = text.length > 14;

  if (!isLong) {
    return (
      <div style={{ height: "22px", display: "flex", alignItems: "center", maxWidth: `${maxWidth}px`, overflow: "hidden" }}>
        <span
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "#f3f4f6",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            lineHeight: "22px",
            letterSpacing: "0.01em",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {text}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: `${maxWidth}px`,
        height: "22px",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        position: "relative",
        maskImage: "linear-gradient(to right, black 85%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to right, black 85%, transparent 100%)",
      }}
    >
      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{ repeat: Infinity, duration: Math.max(text.length * 0.38, 7), ease: "linear" }}
        style={{
          display: "inline-flex",
          gap: "24px",
          whiteSpace: "nowrap",
          lineHeight: "22px",
          fontSize: "12px",
          fontWeight: 600,
          color: "#f3f4f6",
          letterSpacing: "0.01em",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <span>{text}</span>
        <span>{text}</span>
      </motion.div>
    </div>
  );
}

const WINDOWS_APPS = [
  { id: "explorer", name: "Files", Icon: FluentFileExplorer },
  { id: "chrome", name: "Browser", Icon: FluentBrowser },
  { id: "code", name: "VS Code", Icon: FluentVSCode },
  { id: "terminal", name: "Terminal", Icon: FluentTerminal },
  { id: "spotify", name: "Spotify", Icon: FluentSpotify },
  { id: "settings", name: "Cài đặt", Icon: FluentSettings },
  { id: "calc", name: "Máy tính", Icon: FluentCalculator },
  { id: "notepad", name: "Ghi chú", Icon: FluentNotepad },
];

export default function App() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedMode, setExpandedMode] = useState<"apps" | "clipboard">("apps");

  // Media state
  const [media, setMedia] = useState<MediaTrack | null>(null);

  // 1. Volume HUD
  const [volumeLevel, setVolumeLevel] = useState<number | null>(null);
  const volumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 2. Caps Lock HUD
  const [capsLockAlert, setCapsLockAlert] = useState<boolean | null>(null);
  const capsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 3. MagSafe Battery Charging HUD
  const [magsafeAlert, setMagsafeAlert] = useState<{ percent: number; charging: boolean } | null>(null);
  const magsafeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 4. Clipboard Stack
  const [copiedAlert, setCopiedAlert] = useState<string | null>(null);
  const [clipboardHistory, setClipboardHistory] = useState<string[]>([]);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 5. Cài đặt hệ thống: Liquid Glass
  const [liquidGlass, setLiquidGlass] = useState<boolean>(() => {
    try {
      return localStorage.getItem("noryx_liquid_glass") !== "false";
    } catch {
      return true;
    }
  });

  // Bluetooth Popup
  const [bluetoothInfo, setBluetoothInfo] = useState<{ name: string; battery: number } | null>(null);

  // Dropzone File
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [droppedFile, setDroppedFile] = useState<{ name: string; size: string } | null>(null);

  // 6. Cảnh báo quá tải phần cứng CPU / RAM (>90%)
  const [hardwareAlert, setHardwareAlert] = useState<HardwareAlert | null>(null);
  const hardwareTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 7. Live Net Speed (Đo tốc độ tải mạng thực tế)
  const [netSpeed, setNetSpeed] = useState<NetSpeed | null>(null);

  // 8. Chụp màn hình Win+Shift+S / PrtScn kèm ảnh preview
  const [screenshotAlert, setScreenshotAlert] = useState<string | null>(null);
  const screenshotTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 9. Brightness HUD (Độ sáng màn hình)
  const [brightnessLevel, setBrightnessLevel] = useState<number | null>(null);
  const brightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 10. Tự ẩn khi Fullscreen / Chơi game / Xem phim YouTube
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [autoHideFs, setAutoHideFs] = useState<boolean>(() => {
    try {
      return localStorage.getItem("noryx_autohide_fs") !== "false";
    } catch {
      return true;
    }
  });

  const islandRef = useRef<HTMLDivElement>(null);

  // Clock
  const [timeStr, setTimeStr] = useState("");
  const [dateStr, setDateStr] = useState("");

  const hasMusic = Boolean(media && media.title && media.is_playing);

  // Kích thước đảo tính toán theo mức độ ưu tiên
  const isAlertActive =
    screenshotAlert !== null ||
    hardwareAlert !== null ||
    brightnessLevel !== null ||
    capsLockAlert !== null ||
    magsafeAlert !== null ||
    copiedAlert !== null ||
    volumeLevel !== null ||
    bluetoothInfo !== null ||
    isDraggingOver;

  const islandWidth = isDraggingOver
    ? 280
    : screenshotAlert !== null
    ? 270
    : hardwareAlert !== null
    ? 245
    : brightnessLevel !== null
    ? 220
    : magsafeAlert !== null
    ? 260
    : capsLockAlert !== null
    ? 190
    : copiedAlert !== null
    ? 240
    : volumeLevel !== null
    ? 220
    : bluetoothInfo !== null
    ? 230
    : isExpanded
    ? 440
    : hasMusic
    ? 240
    : netSpeed?.is_active && netSpeed.speed_text
    ? 238
    : 196; // Dài hơn xíu (196px) để thời tiết & giờ thoáng đãng, sang trọng chuẩn Apple

  const islandHeight = isDraggingOver
    ? 72
    : screenshotAlert !== null
    ? 44
    : isAlertActive
    ? 38
    : isExpanded
    ? hasMusic
      ? 180
      : 190
    : 36;

  // Chặn chuột phải Web
  useEffect(() => {
    const disableContextMenu = (e: MouseEvent) => e.preventDefault();
    window.addEventListener("contextmenu", disableContextMenu);
    return () => window.removeEventListener("contextmenu", disableContextMenu);
  }, []);

  // Đồng bộ với luồng hit-test Rust
  useEffect(() => {
    invoke("update_island_bounds", {
      width: islandWidth,
      height: islandHeight,
      expanded: isExpanded || isAlertActive,
    }).catch(() => {});
  }, [islandWidth, islandHeight, isExpanded, isAlertActive]);

  // LẮNG NGHE SỰ KIỆN TỪ RUST
  useEffect(() => {
    // 1. Âm lượng Windows
    const unlistenVol = listen<number>("system-volume-changed", (event) => {
      setVolumeLevel(event.payload);
      if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
      volumeTimeoutRef.current = setTimeout(() => setVolumeLevel(null), 2200);
    });

    // 2. Caps Lock Windows
    const unlistenCaps = listen<boolean>("caps-lock-changed", (event) => {
      setCapsLockAlert(event.payload);
      if (capsTimeoutRef.current) clearTimeout(capsTimeoutRef.current);
      capsTimeoutRef.current = setTimeout(() => setCapsLockAlert(null), 1400);
    });

    // 3. Cắm sạc Pin MagSafe Windows
    const unlistenPower = listen<BatteryStatus>("battery-status-changed", (event) => {
      if (event.payload.is_charging) {
        setMagsafeAlert({ percent: event.payload.battery_percent, charging: true });
        if (magsafeTimeoutRef.current) clearTimeout(magsafeTimeoutRef.current);
        magsafeTimeoutRef.current = setTimeout(() => setMagsafeAlert(null), 3400);
      }
    });

    // Đọc trước nội dung clipboard hiện tại từ Windows
    invoke<string | null>("read_clipboard_text")
      .then((initialText) => {
        if (initialText && initialText.trim().length > 0) {
          const trimmed = initialText.trim();
          setClipboardHistory((prev) => (prev.includes(trimmed) ? prev : [trimmed, ...prev].slice(0, 10)));
        }
      })
      .catch(() => {});

    // 4. Clipboard Sequence Copy (Ctrl + C toàn hệ thống)
    const unlistenClip = listen<string>("clipboard-copied", (event) => {
      const text = event.payload;
      if (text && text.trim().length > 0) {
        const trimmed = text.trim();
        const preview = trimmed.slice(0, 24);
        setCopiedAlert(preview);
        setClipboardHistory((prev) => [trimmed, ...prev.filter((t) => t !== trimmed)].slice(0, 10));
        if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
        copyTimeoutRef.current = setTimeout(() => setCopiedAlert(null), 1800);
      }
    });

    // 5. Bluetooth Device HUD
    const unlistenBt = listen<{ name: string; battery: number }>("bluetooth-device-connected", (event) => {
      setBluetoothInfo(event.payload);
      setTimeout(() => setBluetoothInfo(null), 3200);
    });

    // 6. Cảnh báo quá tải CPU / RAM
    const unlistenHardware = listen<HardwareAlert>("hardware-alert", (event) => {
      setHardwareAlert(event.payload);
      if (hardwareTimeoutRef.current) clearTimeout(hardwareTimeoutRef.current);
      hardwareTimeoutRef.current = setTimeout(() => setHardwareAlert(null), 3200);
    });

    // 7. Live Net Speed (Đo tốc độ mạng thời gian thực)
    const unlistenNet = listen<NetSpeed>("net-speed", (event) => {
      setNetSpeed(event.payload);
    });

    // 8. Ảnh chụp màn hình Snipping Tool / PrtScn preview
    const unlistenScreenshot = listen<string>("screenshot-captured", (event) => {
      const imgDataUrl = event.payload;
      setScreenshotAlert(imgDataUrl);
      setClipboardHistory((prev) => ["[Hình ảnh] Ảnh chụp màn hình", ...prev].slice(0, 10));
      if (screenshotTimeoutRef.current) clearTimeout(screenshotTimeoutRef.current);
      screenshotTimeoutRef.current = setTimeout(() => setScreenshotAlert(null), 3500);
    });

    // 9. Độ sáng màn hình (Brightness HUD)
    const unlistenBright = listen<number>("system-brightness-changed", (event) => {
      setBrightnessLevel(event.payload);
      if (brightTimeoutRef.current) clearTimeout(brightTimeoutRef.current);
      brightTimeoutRef.current = setTimeout(() => setBrightnessLevel(null), 2200);
    });

    // 10. Tự ẩn khi chơi Game / Xem phim YouTube Fullscreen
    const unlistenFs = listen<boolean>("fullscreen-changed", (event) => {
      setIsFullScreen(event.payload);
    });

    // 11. Lắng nghe thay đổi chế độ Liquid Glass & Fullscreen Auto-hide
    const handleStorage = () => {
      try {
        setLiquidGlass(localStorage.getItem("noryx_liquid_glass") !== "false");
        setAutoHideFs(localStorage.getItem("noryx_autohide_fs") !== "false");
      } catch {}
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      unlistenVol.then((f) => f());
      unlistenCaps.then((f) => f());
      unlistenPower.then((f) => f());
      unlistenClip.then((f) => f());
      unlistenBt.then((f) => f());
      unlistenHardware.then((f) => f());
      unlistenNet.then((f) => f());
      unlistenScreenshot.then((f) => f());
      unlistenBright.then((f) => f());
      unlistenFs.then((f) => f());
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  // Lăn chuột: Bên trái chỉnh Độ sáng màn hình, Bên phải chỉnh Âm lượng
  const handleWheel = (e: React.WheelEvent) => {
    const rect = islandRef.current?.getBoundingClientRect();
    const isLeftSide = rect ? e.clientX < rect.left + rect.width / 2 : false;

    if (isLeftSide) {
      const delta = e.deltaY < 0 ? 0.04 : -0.04;
      invoke<number>("adjust_brightness", { delta })
        .then((newBright) => {
          setBrightnessLevel(newBright);
          if (brightTimeoutRef.current) clearTimeout(brightTimeoutRef.current);
          brightTimeoutRef.current = setTimeout(() => setBrightnessLevel(null), 2200);
        })
        .catch(() => {});
    } else {
      const delta = e.deltaY < 0 ? 0.02 : -0.02;
      invoke<number>("adjust_volume", { delta })
        .then((newVol) => {
          setVolumeLevel(Math.round(newVol * 100));
          if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
          volumeTimeoutRef.current = setTimeout(() => setVolumeLevel(null), 2200);
        })
        .catch(() => {});
    }
  };

  // Tự động thu nhỏ khi click ra ngoài
  useEffect(() => {
    const handleBlur = () => setIsExpanded(false);
    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, []);

  // Đồng hồ & ngày
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }));
      const days = ["CN", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
      setDateStr(`${days[now.getDay()]}, ${now.getDate()} thg ${now.getMonth() + 1}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Lắng nghe nhạc từ Windows GSMTC
  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const info = await invoke<MediaTrack | null>("get_current_media");
        if (info && info.title && info.is_playing) {
          setMedia(info);
        } else {
          setMedia(null);
        }
      } catch {
        setMedia(null);
      }
    };
    fetchMedia();
    const interval = setInterval(fetchMedia, 1200);
    return () => clearInterval(interval);
  }, []);

  // Điều khiển nhạc
  const togglePlayPause = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await invoke("media_play_pause");
      if (media) setMedia({ ...media, is_playing: !media.is_playing });
    } catch {}
  };

  const skipNext = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await invoke("media_next");
    } catch {}
  };

  const skipPrev = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await invoke("media_previous");
    } catch {}
  };

  const toggleExpand = (val?: boolean) => {
    const nextVal = typeof val === "boolean" ? val : !isExpanded;
    setIsExpanded(nextVal);
  };

  const handleLaunchApp = (appId: string) => {
    invoke("launch_app", { target: appId }).catch(() => {});
    toggleExpand(false);
  };

  // Kéo thả Dropzone
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => setIsDraggingOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const sizeKb = (file.size / 1024).toFixed(1);
      setDroppedFile({ name: file.name, size: `${sizeKb} KB` });
    }
  };

  const isYoutube =
    media?.source_app_id?.toLowerCase().includes("chrome") ||
    media?.source_app_id?.toLowerCase().includes("msedge") ||
    media?.source_app_id?.toLowerCase().includes("brave") ||
    media?.title?.toLowerCase().includes("youtube");

  return (
    <div
      onClick={() => toggleExpand(false)}
      onContextMenu={(e) => e.preventDefault()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        paddingTop: "6px",
        userSelect: "none",
        background: "transparent",
      }}
    >
      <motion.div
        animate={{
          opacity: isFullScreen && autoHideFs ? 0 : 1,
          y: isFullScreen && autoHideFs ? -40 : 0,
          scale: isFullScreen && autoHideFs ? 0.9 : 1,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        style={{
          pointerEvents: isFullScreen && autoHideFs ? "none" : "auto",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <motion.div
          ref={islandRef}
          layout
          transition={springConfig}
          onWheel={handleWheel}
          onClick={(e) => {
            e.stopPropagation();
            if (!isAlertActive) toggleExpand();
          }}
          whileHover={{ scale: isExpanded ? 1 : 1.015 }}
          whileTap={{ scale: 0.985 }}
          style={{
            backgroundColor: liquidGlass ? "rgba(12, 14, 22, 0.68)" : "#000000",
            backdropFilter: liquidGlass ? "blur(32px) saturate(210%) brightness(108%)" : "none",
            WebkitBackdropFilter: liquidGlass ? "blur(32px) saturate(210%) brightness(108%)" : "none",
            color: "#ffffff",
            borderRadius: isExpanded ? 36 : 9999,
            border: liquidGlass ? "1px solid rgba(255, 255, 255, 0.2)" : "none",
            boxShadow: liquidGlass
              ? isExpanded
                ? "0 28px 65px rgba(0, 0, 0, 0.75), inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.45), inset 0 -1px 2px 0 rgba(0, 0, 0, 0.4), 0 0 20px rgba(56, 189, 248, 0.15)"
                : "0 10px 28px rgba(0, 0, 0, 0.65), inset 0 1px 1.2px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 1.5px 0 rgba(0, 0, 0, 0.35)"
              : isExpanded
              ? "0 24px 60px rgba(0, 0, 0, 0.95), 0 0 1px rgba(255,255,255,0.18)"
              : "0 8px 24px rgba(0, 0, 0, 0.8), 0 0 1px rgba(255,255,255,0.15)",
            cursor: "pointer",
            overflow: "hidden",
            boxSizing: "border-box",
            position: "relative",
            fontFamily: "'Inter', sans-serif",
            transition: "background-color 0.25s ease, border 0.25s ease, box-shadow 0.25s ease",
          }}
          animate={{
            width: islandWidth,
            height: islandHeight,
          }}
        >
          {/* Lớp phản chiếu Liquid Glass tĩnh (không có thanh xoay làm hoa mắt) */}
          {liquidGlass && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "46%",
                background: "linear-gradient(180deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.02) 65%, transparent 100%)",
                borderRadius: "inherit",
                pointerEvents: "none",
                zIndex: 1,
              }}
            />
          )}
          <AnimatePresence mode="wait">
            {/* ============================================================== */}
            {/* A. CÁC POPUP CẢNH BÁO NỔI BẬT (EPHEMERAL HUDs)                */}
            {/* ============================================================== */}

            {/* 1. SCREENSHOT CAPTURE HUD CÓ ẢNH PREVIEW THỰC TẾ */}
            {screenshotAlert !== null ? (
              <motion.div
                key="screenshot-hud"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.12 }}
                style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 10px 0 12px" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "24px", height: "24px", borderRadius: "7px", backgroundColor: "rgba(56, 189, 248, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Camera size={13} color="#38bdf8" />
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#ffffff", lineHeight: 1.2 }}>Ảnh chụp màn hình</div>
                    <div style={{ fontSize: "9px", color: "#9ca3af", lineHeight: 1 }}>Đã lưu vào bộ nhớ tạm</div>
                  </div>
                </div>
                <img
                  src={screenshotAlert}
                  alt="Preview"
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "7px",
                    objectFit: "cover",
                    border: "1px solid rgba(255, 255, 255, 0.28)",
                    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.5)",
                  }}
                />
              </motion.div>
            ) : hardwareAlert !== null ? (
              /* 2. CẢNH BÁO QUÁ TẢI CPU / RAM (HỔ PHÁCH) */
              <motion.div
                key="hardware-hud"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.12 }}
                style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "0 12px" }}
              >
                <div style={{ width: "20px", height: "20px", borderRadius: "6px", backgroundColor: "rgba(245, 158, 11, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Cpu size={13} color="#f59e0b" />
                </div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#f59e0b", letterSpacing: "0.02em" }}>
                  CPU {hardwareAlert.cpu_percent}% • RAM {hardwareAlert.ram_used_gb.toFixed(1)} GB
                </span>
              </motion.div>
            ) : brightnessLevel !== null ? (
              /* 3. BRIGHTNESS HUD (ĐỘ SÁNG MÀN HÌNH VIÊN THUỐC) */
              <motion.div
                key="brightness-hud"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.12 }}
                style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", padding: "0 14px", gap: "10px" }}
              >
                <SunMedium size={15} color="#f59e0b" />
                <div style={{ flex: 1, height: "5px", backgroundColor: "rgba(255,255,255,0.2)", borderRadius: "9999px", overflow: "hidden" }}>
                  <div style={{ width: `${brightnessLevel}%`, height: "100%", backgroundColor: "#f59e0b", borderRadius: "9999px", transition: "width 0.08s ease-out" }} />
                </div>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#ffffff", minWidth: "28px", textAlign: "right" }}>{brightnessLevel}%</span>
              </motion.div>
            ) : magsafeAlert !== null ? (
              /* 4. MAGSAFE CHARGING HUD */
              <motion.div
                key="magsafe-hud"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.12 }}
                style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", padding: "0 14px", gap: "10px" }}
              >
                <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: "2px solid #22c55e", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Zap size={11} color="#22c55e" />
                </div>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#ffffff" }}>
                  Đang sạc • {magsafeAlert.percent}%
                </span>
              </motion.div>
            ) : capsLockAlert !== null ? (
              /* 5. CAPS LOCK HUD */
              <motion.div
                key="caps-hud"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.12 }}
                style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                <ArrowUpSquare size={13} color={capsLockAlert ? "#f59e0b" : "#9ca3af"} />
                <span style={{ fontSize: "11px", fontWeight: 700, color: capsLockAlert ? "#f59e0b" : "#9ca3af", letterSpacing: "0.04em" }}>
                  CAPS LOCK {capsLockAlert ? "BẬT" : "TẮT"}
                </span>
              </motion.div>
            ) : copiedAlert !== null ? (
              /* 6. CLIPBOARD COPY HUD */
              <motion.div
                key="clip-hud"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.12 }}
                style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", padding: "0 14px", gap: "8px" }}
              >
                <Copy size={13} color="#38bdf8" />
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#f3f4f6", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  Đã chép: "{copiedAlert}"
                </span>
              </motion.div>
            ) : volumeLevel !== null ? (
              /* 7. VOLUME HUD */
              <motion.div
                key="volume-hud"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.12 }}
                style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", padding: "0 14px", gap: "10px" }}
              >
                {volumeLevel === 0 ? <VolumeX size={15} color="#ef4444" /> : <Volume2 size={15} color="#ffffff" />}
                <div style={{ flex: 1, height: "5px", backgroundColor: "rgba(255,255,255,0.2)", borderRadius: "9999px", overflow: "hidden" }}>
                  <div style={{ width: `${volumeLevel}%`, height: "100%", backgroundColor: "#ffffff", borderRadius: "9999px", transition: "width 0.08s ease-out" }} />
                </div>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#ffffff", minWidth: "28px", textAlign: "right" }}>{volumeLevel}%</span>
              </motion.div>
            ) : bluetoothInfo !== null ? (
              /* 8. BLUETOOTH AIRPODS HUD */
              <motion.div
                key="bluetooth-hud"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.12 }}
                style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Headphones size={15} color="#38bdf8" />
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#ffffff" }}>{bluetoothInfo.name}</span>
                </div>
                <span style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "11px", fontWeight: 600, color: "#22c55e" }}>
                  <Zap size={11} color="#22c55e" /> {bluetoothInfo.battery}%
                </span>
              </motion.div>
            ) : isDraggingOver ? (
              /* 9. DROPZONE HÚT FILE */
              <motion.div
                key="dropzone-hud"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.12 }}
                style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "3px", border: "2px dashed #38bdf8", borderRadius: "20px" }}
              >
                <UploadCloud size={20} color="#38bdf8" />
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#38bdf8" }}>Thả file vào đây để ghim</span>
              </motion.div>
            ) : !isExpanded ? (
              /* ============================================================== */
              /* B. TRẠNG THÁI THU GỌN (COMPACT PILL)                           */
              /* ============================================================== */
              <motion.div
                key="compact-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: hasMusic ? "0 10px 0 8px" : "0 18px",
                  boxSizing: "border-box",
                }}
              >
                {!hasMusic ? (
                  /* B.1: ĐỒNG HỒ + THỜI TIẾT + LIVE NET SPEED (INTER FONT CỰC NÉT) */
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "#9ca3af", lineHeight: 1, fontFamily: "'Inter', sans-serif" }}>28°</span>
                      <SunMedium size={14} color="#f59e0b" />
                    </div>
                    {netSpeed?.is_active && netSpeed.speed_text && (
                      <div style={{ display: "flex", alignItems: "center", gap: "3px", padding: "2px 6px", borderRadius: "6px", backgroundColor: "rgba(56, 189, 248, 0.12)" }}>
                        <ArrowDown size={11} color="#38bdf8" />
                        <span style={{ fontSize: "10px", fontWeight: 700, color: "#38bdf8", fontFamily: "'Inter', sans-serif" }}>
                          {netSpeed.speed_text}
                        </span>
                      </div>
                    )}
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#f3f4f6",
                        letterSpacing: "0.03em",
                        lineHeight: 1,
                        whiteSpace: "nowrap",
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      {timeStr || "12:00"}
                    </span>
                  </>
                ) : (
                /* B.2: CÓ NHẠC/YOUTUBE */
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", height: "100%", minWidth: 0 }}>
                    {media?.thumbnail_base64 ? (
                      <img src={media.thumbnail_base64} alt="Thumb" style={{ width: "22px", height: "22px", borderRadius: "7px", objectFit: "cover", flexShrink: 0, display: "block" }} />
                    ) : isYoutube ? (
                      <div style={{ width: "22px", height: "22px", borderRadius: "7px", backgroundColor: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <YoutubeIcon size={12} />
                      </div>
                    ) : (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                        style={{ width: "22px", height: "22px", borderRadius: "50%", background: "linear-gradient(135deg, #10b981, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                      >
                        <Music2 size={11} color="#ffffff" />
                      </motion.div>
                    )}

                    {/* Hiển thị tiêu đề bài hát lướt ngang */}
                    <MarqueeText text={media?.title || ""} maxWidth={140} />
                  </div>

                  {/* Sóng âm thanh thật nhấp nhô */}
                  <div style={{ display: "flex", alignItems: "center", gap: "2.5px", height: "22px", flexShrink: 0 }}>
                    {[4, 11, 7, 13].map((targetH, i) => (
                      <motion.span
                        key={i}
                        animate={{ height: ["4px", `${targetH}px`, "4px"] }}
                        transition={{ repeat: Infinity, duration: 0.5 + i * 0.12, repeatType: "reverse", ease: "easeInOut" }}
                        style={{ width: "2.5px", backgroundColor: isYoutube ? "#ef4444" : "#22c55e", borderRadius: "9999px", display: "inline-block", transformOrigin: "center center" }}
                      />
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          ) : (
            /* ============================================================== */
            /* C. TRẠNG THÁI MỞ RỘNG (EXPANDED CARD ĐA NĂNG)                  */
            /* ============================================================== */
            <motion.div
              key="expanded-view"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.16 }}
              style={{
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                height: "100%",
                boxSizing: "border-box",
                fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {hasMusic ? (
                /* ========================================================== */
                /* C.1: TRÌNH PHÁT NHẠC + KARAOKE LYRICS CHUẨN IOS 18         */
                /* ========================================================== */
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    {media?.thumbnail_base64 ? (
                      <img src={media.thumbnail_base64} alt="Album" style={{ width: "54px", height: "54px", borderRadius: "16px", objectFit: "cover", flexShrink: 0, boxShadow: "0 8px 20px rgba(0,0,0,0.8)" }} />
                    ) : (
                      <div style={{ width: "54px", height: "54px", borderRadius: "16px", background: isYoutube ? "linear-gradient(135deg, #ef4444, #991b1b)" : "linear-gradient(135deg, #10b981, #047857)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {isYoutube ? <YoutubeIcon size={26} /> : <Music2 size={26} color="#ffffff" />}
                      </div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "3px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: isYoutube ? "#ef4444" : "#22c55e", boxShadow: isYoutube ? "0 0 8px #ef4444" : "0 0 8px #22c55e" }} />
                          <span style={{ fontSize: "10px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.04em", fontFamily: "'Inter', sans-serif" }}>
                            {isYoutube ? "YouTube" : "Spotify"}
                          </span>
                        </div>
                      </div>

                      <MarqueeText text={media?.title || ""} maxWidth={310} />
                      <p style={{ fontSize: "11px", color: "#9ca3af", margin: "2px 0 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'Inter', sans-serif" }}>
                        {media?.artist || "Đang phát"}
                      </p>
                    </div>
                  </div>

                  {/* Thanh tiến trình */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                    <div style={{ width: "100%", height: "4px", backgroundColor: "rgba(255,255,255,0.12)", borderRadius: "9999px", overflow: "hidden" }}>
                      <motion.div
                        style={{ backgroundColor: "#ffffff", height: "100%", borderRadius: "9999px" }}
                        animate={{ width: `${Math.min(((media?.position_seconds || 0) / (media?.duration_seconds || 1)) * 100, 100)}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#9ca3af", fontFamily: "'Inter', sans-serif" }}>
                      <span>{Math.floor((media?.position_seconds || 0) / 60)}:{Math.floor((media?.position_seconds || 0) % 60).toString().padStart(2, "0")}</span>
                      <span>{Math.floor((media?.duration_seconds || 0) / 60)}:{Math.floor((media?.duration_seconds || 0) % 60).toString().padStart(2, "0")}</span>
                    </div>
                  </div>

                  {/* Cụm điều khiển */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "28px" }}>
                    <button onClick={skipPrev} style={{ background: "none", border: "none", color: "#d1d5db", cursor: "pointer" }}><SkipBack size={20} /></button>
                    <button
                      onClick={togglePlayPause}
                      style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#ffffff", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 14px rgba(255,255,255,0.25)" }}
                    >
                      {media?.is_playing ? <Pause size={16} fill="#000000" color="#000000" /> : <Play size={16} fill="#000000" color="#000000" style={{ marginLeft: "2px" }} />}
                    </button>
                    <button onClick={skipNext} style={{ background: "none", border: "none", color: "#d1d5db", cursor: "pointer" }}><SkipForward size={20} /></button>
                  </div>
                </div>
              ) : (
                /* ========================================================== */
                /* C.2: LAUNCHER & CLIPBOARD STACK                            */
                /* ========================================================== */
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
                  {/* Thanh điều hướng: Ngày tháng + Tabs */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#38bdf8", boxShadow: "0 0 8px #38bdf8" }} />
                      <span style={{ fontSize: "11px", fontWeight: 600, color: "#d1d5db", fontFamily: "'Inter', sans-serif" }}>{dateStr}</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(255,255,255,0.08)", padding: "2px", borderRadius: "9999px" }}>
                      <button
                        onClick={() => setExpandedMode("apps")}
                        style={{ padding: "3px 12px", borderRadius: "9999px", fontSize: "10px", fontWeight: 600, cursor: "pointer", border: "none", backgroundColor: expandedMode === "apps" ? "#ffffff" : "transparent", color: expandedMode === "apps" ? "#000" : "#9ca3af", fontFamily: "'Inter', sans-serif" }}
                      >
                        Ứng dụng
                      </button>
                      <button
                        onClick={() => setExpandedMode("clipboard")}
                        style={{ padding: "3px 12px", borderRadius: "9999px", fontSize: "10px", fontWeight: 600, cursor: "pointer", border: "none", backgroundColor: expandedMode === "clipboard" ? "#ffffff" : "transparent", color: expandedMode === "clipboard" ? "#000" : "#9ca3af", fontFamily: "'Inter', sans-serif" }}
                      >
                        Khay tạm ({clipboardHistory.length})
                      </button>
                    </div>
                  </div>

                  {/* 1. CHẾ ĐỘ ỨNG DỤNG WINDOWS 11 FLUENT */}
                  {expandedMode === "apps" && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", padding: "4px 0" }}>
                      {WINDOWS_APPS.map((app) => {
                        const IconComponent = app.Icon;
                        return (
                          <motion.button
                            key={app.id}
                            whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.12)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleLaunchApp(app.id)}
                            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", padding: "8px 4px", borderRadius: "14px", background: "rgba(255,255,255,0.06)", border: "none", cursor: "pointer", color: "#ffffff" }}
                          >
                            <div style={{ width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <IconComponent />
                            </div>
                            <span style={{ fontSize: "10px", color: "#e5e7eb", fontWeight: 500 }}>{app.name}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}

                  {/* 2. CHẾ ĐỘ CLIPBOARD STACK (LỊCH SỬ COPY THÔNG MINH) */}
                  {expandedMode === "clipboard" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "115px", overflowY: "auto", paddingRight: "4px" }}>
                      {clipboardHistory.length === 0 ? (
                        <div style={{ padding: "18px 0", textAlign: "center", color: "#6b7280", fontSize: "11px" }}>
                          Chưa có lịch sử copy. Bấm <span style={{ color: "#38bdf8", fontWeight: 600 }}>Ctrl + C</span> ở bất kỳ đâu để lưu vào đây!
                        </div>
                      ) : (
                        clipboardHistory.map((item, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              invoke("write_clipboard_text", { text: item }).catch(() => {});
                              navigator.clipboard.writeText(item).catch(() => {});
                              setCopiedAlert(item.slice(0, 20));
                              if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
                              copyTimeoutRef.current = setTimeout(() => setCopiedAlert(null), 1500);
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "6px 10px",
                              borderRadius: "10px",
                              backgroundColor: "rgba(255,255,255,0.06)",
                              cursor: "pointer",
                              fontSize: "11px",
                              color: "#e5e7eb",
                            }}
                          >
                            {item.startsWith("[Hình ảnh]") ? (
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <Camera size={12} color="#38bdf8" />
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "320px", color: "#38bdf8", fontWeight: 600 }}>
                                  {item}
                                </span>
                              </div>
                            ) : (
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "340px" }}>
                                {item}
                              </span>
                            )}
                            <span style={{ fontSize: "9px", color: "#38bdf8", flexShrink: 0, marginLeft: "8px" }}>
                              {item.startsWith("[Hình ảnh]") ? "Xem lại" : "Dán lại"}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Footer sạch sẽ, tinh gọn */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "5px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "10px", color: "#6b7280", fontFamily: "'Inter', sans-serif" }}>
                        {droppedFile ? `Đã ghim: ${droppedFile.name} (${droppedFile.size})` : "Kéo thả file vào đảo để ghim nhanh"}
                      </span>
                      {droppedFile && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDroppedFile(null);
                          }}
                          style={{ background: "none", border: "none", color: "#ef4444", fontSize: "10px", cursor: "pointer", padding: "0 4px", fontFamily: "'Inter', sans-serif" }}
                        >
                          Bỏ ghim
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  </div>
  );
}
