<div align="center">

<img src="./assets/banner.png" alt="Noryx Dynamic Island Banner" width="180" style="border-radius: 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.6);" />

# Noryx Dynamic Island for Windows

**Trải nghiệm Dynamic Island đẳng cấp Apple trên Windows 10 & 11**  
*An ultra-refined, fluid Dynamic Island built with Tauri v2, Rust & React 19.*

[![Platform: Windows](https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011-0078D6?style=for-the-badge&logo=windows&logoColor=white)](https://github.com)
[![Framework: Tauri v2](https://img.shields.io/badge/Tauri-v2-FFC131?style=for-the-badge&logo=tauri&logoColor=black)](https://tauri.app)
[![Backend: Rust](https://img.shields.io/badge/Backend-Rust-DEA584?style=for-the-badge&logo=rust&logoColor=black)](https://www.rust-lang.org)
[![Frontend: React 19](https://img.shields.io/badge/Frontend-React%2019-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

<br/>

[Tải về bản Release](#-tải-về-và-cài-đặt-download) • [Tính năng nổi bật](#-tính-năng-nổi-bật-features) • [Cử chỉ & Phím tắt](#-cử-chỉ--phím-tắt-shortcuts--gestures) • [Hướng dẫn cài đặt](#-hướng-dẫn-phát-triển-build-from-source)

</div>

---

## 📸 Hình ảnh Demo (Visual Demos)

<div align="center">

### 1. Trạng thái thu gọn tinh tế (Compact Pill)
Thời tiết thực tế, đồng hồ giờ/phút sắc nét chuẩn font **Inter** kết hợp chỉ số quyền riêng tư Microphone & Camera.

<img src="./assets/demo-compact.png" alt="Dynamic Island Compact Pill" width="400" style="border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.4);" />

<br/><br/>

### 2. Trình phát nhạc & Sóng âm nhịp nhàng (Music Island)
Tự động đồng bộ với Spotify, YouTube, Apple Music qua Windows GSMTC kèm ảnh bìa album và sóng âm tần số.

<img src="./assets/demo-music.png" alt="Dynamic Island Music Player" width="420" style="border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.4);" />

<br/><br/>

### 3. Tự nhiên trên màn hình làm việc (Desktop Integration)
Neo nhẹ nhàng ngay đỉnh màn hình máy tính, tích hợp hiệu ứng **Liquid Glass** (kính lỏng khúc xạ) trong suốt sang trọng.

<img src="./assets/demo-desktop.png" alt="Dynamic Island Desktop Workspace" width="700" style="border-radius: 12px; box-shadow: 0 12px 36px rgba(0,0,0,0.5);" />

</div>

---

## ⚡ Tính năng nổi bật (Features)

### 🎵 Trải nghiệm Âm nhạc & Giải trí đỉnh cao
- **Đồng bộ đa nền tảng**: Tự động nhận diện bài hát đang phát từ **Spotify, YouTube, Apple Music, Soundcloud, Zing MP3, v.v.**
- **Bắt sóng âm thanh sống động**: Cột sóng nhấp nhô theo nhịp bài hát.
- **Marquee Title**: Tiêu đề bài hát dài sẽ tự động chạy chữ lướt ngang mượt mà.
- **Thanh điều khiển mở rộng**: Bấm vào đảo để tua bài, xem thời lượng, Play/Pause, Next/Previous và ảnh bìa chất lượng cao.

### 🛡️ Quyền riêng tư & Cảnh báo tức thì (HUDs)
- **Đèn báo Mic / Camera**: Sáng chấm màu cam khi Mic hoạt động, chấm xanh lá khi Webcam bật (chuẩn phong cách Apple iOS).
- **Xem trước Ảnh chụp màn hình (Screenshot Preview)**: Bấm `Win + Shift + S` hoặc `PrtScn`, đảo lập tức hiển thị thumbnail ảnh bạn vừa chụp cùng trạng thái lưu vào clipboard.
- **Cảnh báo quá tải phần cứng**: Khi render video hay chơi game mà **CPU hoặc RAM chạm ngưỡng $\ge 90\%$**, đảo bung nhẹ cảnh báo màu hổ phách `CPU 92% • RAM 14.2 GB` trong 3.2 giây.
- **Đo tốc độ mạng thời gian thực (Live Net Speed)**: Khi trình duyệt hoặc Steam tải file ($> 120\text{ KB/s}$), cạnh đồng hồ sẽ hiện tốc độ tải ngầm `14.5 MB/s`.
- **Hiệu ứng sạc MagSafe**: Cắm sạc laptop hiển thị vòng tròn xanh lá và phần trăm pin sạc.
- **Caps Lock HUD**: Báo `CAPS LOCK BẬT / TẮT` dạng viên thuốc khi gõ phím.
- **Volume & Brightness HUD**: Thanh trượt độ sáng và âm lượng viên thuốc thay thế hoàn toàn cho thanh vuông thô mặc định của Windows.

### 🎮 Trải nghiệm Thông minh & Hiệu suất
- **Tự ẩn khi Fullscreen / Chơi Game**: Khi vào game (Valorant, CS2, LOL, v.v.) hoặc xem phim YouTube Fullscreen, Dynamic Island sẽ tự động trượt lên và ẩn hoàn toàn để không che khuất thanh máu hay tầm nhìn.
- **Nhận diện Màn hình chính (Desktop Safe)**: Không bị ẩn nhầm khi đang ở ngoài màn hình chính (Desktop).
- **Khay nhớ tạm thông minh (Clipboard Stack)**: Lưu nhanh 10 mục văn bản và ảnh chụp màn hình gần nhất để click dán lại tức thì.
- **Kéo thả ghim file (Dropzone)**: Kéo bất kỳ file nào từ Desktop thả vào đảo để ghim nhanh.
- **Khởi động cùng Windows**: Tùy chọn tự chạy khi bật máy qua Registry an toàn.

---

## 🖐️ Cử chỉ & Phím tắt (Shortcuts & Gestures)

| Thao tác | Vị trí / Cử chỉ | Tác dụng |
| :--- | :--- | :--- |
| **Lăn chuột (Scroll Up/Down)** | **Nửa bên trái viên đảo** | Tăng / Giảm **Độ sáng màn hình** (Brightness HUD) |
| **Lăn chuột (Scroll Up/Down)** | **Nửa bên phải viên đảo** | Tăng / Giảm **Âm lượng hệ thống** (Volume HUD) |
| **Click chuột trái** | **Thân Dynamic Island** | Mở rộng thanh Launcher ứng dụng hoặc Khay nhớ tạm |
| **Click chuột trái / phải** | **Icon ở góc Taskbar Tray** | Bật / Tắt Menu Cài đặt nhanh ở góc dưới bên phải |
| **Win + Shift + S / PrtScn** | **Bất kỳ đâu** | Tự động bắt ảnh chụp màn hình và hiện thumbnail preview |
| **Ctrl + C** | **Bất kỳ đâu** | Tự động lưu vào ngăn xếp Clipboard Stack của đảo |

---

## 📦 Tải về và Cài đặt (Download)

Các file biên dịch sẵn nằm trực tiếp trong thư mục [`release/`](./release/):

| Phiên bản | Tên file | Dung lượng | Đặc điểm |
| :--- | :--- | :---: | :--- |
| **Bản Cài đặt (Installer)** | [**`Noryx_Dynamic_Island_Setup.exe`**](./release/Noryx_Dynamic_Island_Setup.exe) | **1.69 MB** | Tự tạo Shortcut Desktop, Start Menu, quản lý gỡ cài đặt tiện lợi |
| **Bản Di động (Portable)** | [**`Noryx_Dynamic_Island_Portable.exe`**](./release/Noryx_Dynamic_Island_Portable.exe) | **4.74 MB** | Chạy ngay không cần cài đặt, copy USB hoặc chia sẻ nhanh |

---

## 🛠️ Hướng dẫn phát triển (Build from Source)

### Yêu cầu môi trường (Prerequisites)
- [Node.js](https://nodejs.org/) (phiên bản 18+ hoặc 20+)
- [Rust & Cargo](https://rustup.rs/) (phiên bản 1.75+)
- Hệ điều hành: **Windows 10 / 11** (64-bit)

### Các bước cài đặt & chạy mã nguồn

1. **Clone repository**:
   ```bash
   git clone https://github.com/noryx/dynamic-island.git
   cd dynamic-island
   ```

2. **Cài đặt dependencies**:
   ```bash
   npm install
   ```

3. **Chạy ở môi trường Development**:
   ```bash
   npm run tauri:dev
   ```

4. **Biên dịch bản Release**:
   ```bash
   npm run tauri:build
   ```
   *File cài đặt `.exe` và `.msi` sẽ được tự động xuất ra thư mục `src-tauri/target/release/bundle/`.*

---

## 🏗️ Kiến trúc công nghệ (Tech Stack)

- **Engine Core**: [Tauri v2](https://v2.tauri.app/) (Siêu nhẹ, tiêu tốn ít RAM hơn 90% so với Electron)
- **Backend Subsystem**: [Rust 2021](https://www.rust-lang.org/)
  - `windows-rs 0.58` (Win32 API, GSMTC Media Control, WASAPI Volume, GDI Monitors)
  - `sysinfo 0.33` (Giám sát tốc độ mạng, CPU & RAM tiêu thụ thời gian thực)
- **Frontend Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Animation Engine**: [Framer Motion](https://www.framer.com/motion/) (Spring Physics cao cấp 60fps)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + Apple Liquid Glass Morphing
- **Vector Icons**: [Lucide React](https://lucide.dev/) (Chuẩn hóa $100\%$ không dùng emoji)

---

## 📄 Bản quyền (License)

Dự án được phân phối dưới giấy phép **MIT License**. Bạn hoàn toàn có thể tự do sử dụng, chỉnh sửa và phân phối.  
*Được thiết kế và phát triển bởi Noryx Studio.*
