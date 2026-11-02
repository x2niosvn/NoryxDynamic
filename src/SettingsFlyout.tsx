import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
  Power,
  Sparkles,
  Eye,
  EyeOff,
  LogOut,
  X,
  Maximize2,
} from "lucide-react";

export default function SettingsFlyout() {
  const [autoStart, setAutoStart] = useState<boolean>(false);
  const [liquidGlass, setLiquidGlass] = useState<boolean>(() => {
    try {
      return localStorage.getItem("noryx_liquid_glass") !== "false";
    } catch {
      return true;
    }
  });
  const [autoHideFs, setAutoHideFs] = useState<boolean>(() => {
    try {
      return localStorage.getItem("noryx_autohide_fs") !== "false";
    } catch {
      return true;
    }
  });
  const [islandVisible, setIslandVisible] = useState<boolean>(true);

  useEffect(() => {
    // Chặn chuột phải menu web
    const disableContextMenu = (e: MouseEvent) => e.preventDefault();
    window.addEventListener("contextmenu", disableContextMenu);

    // Tự động đóng menu khi click ra ngoài (mất focus), có độ trễ nhỏ tránh đóng nhầm khi vừa khởi tạo
    const mountedTime = Date.now();
    const handleBlur = () => {
      if (Date.now() - mountedTime > 200) {
        invoke("close_settings_window").catch(() => {});
      }
    };
    window.addEventListener("blur", handleBlur);

    // Lấy trạng thái từ hệ thống
    invoke<boolean>("get_autostart_status")
      .then(setAutoStart)
      .catch(() => {});

    invoke<boolean>("is_main_window_visible")
      .then(setIslandVisible)
      .catch(() => {});

    const unlistenAuto = listen<boolean>("autostart-changed", (e) => {
      setAutoStart(e.payload);
    });

    return () => {
      window.removeEventListener("contextmenu", disableContextMenu);
      window.removeEventListener("blur", handleBlur);
      unlistenAuto.then((f) => f());
    };
  }, []);

  const handleToggleAutoStart = async () => {
    try {
      const next = await invoke<boolean>("toggle_autostart");
      setAutoStart(next);
    } catch {}
  };

  const handleToggleLiquidGlass = () => {
    const next = !liquidGlass;
    setLiquidGlass(next);
    try {
      localStorage.setItem("noryx_liquid_glass", String(next));
      window.dispatchEvent(new Event("storage"));
    } catch {}
  };

  const handleToggleAutoHideFs = () => {
    const next = !autoHideFs;
    setAutoHideFs(next);
    try {
      localStorage.setItem("noryx_autohide_fs", String(next));
      window.dispatchEvent(new Event("storage"));
    } catch {}
  };

  const handleToggleIsland = async () => {
    try {
      const isVisible = await invoke<boolean>("toggle_main_window");
      setIslandVisible(isVisible);
    } catch {}
  };

  const handleClose = () => {
    invoke("close_settings_window").catch(() => {});
  };

  const handleExit = () => {
    invoke("exit_app").catch(() => {});
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "8px",
        boxSizing: "border-box",
        userSelect: "none",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(14, 16, 24, 0.88)",
          backdropFilter: "blur(28px) saturate(190%)",
          WebkitBackdropFilter: "blur(28px) saturate(190%)",
          borderRadius: "20px",
          border: "1px solid rgba(255, 255, 255, 0.14)",
          boxShadow: "0 24px 50px rgba(0, 0, 0, 0.75), inset 0 1px 1.5px rgba(255, 255, 255, 0.25)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "16px 14px",
          boxSizing: "border-box",
          color: "#ffffff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Top Specular Rim */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "40%",
            background: "linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.02) 60%, transparent 100%)",
            borderRadius: "inherit",
            pointerEvents: "none",
          }}
        />

        {/* Header với Icon ứng dụng mới cực đẹp */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", position: "relative", zIndex: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
            <img
              src="/app-icon.png"
              alt="App Logo"
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                objectFit: "cover",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.5)",
              }}
            />
            <div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#ffffff", letterSpacing: "0.02em" }}>Cài đặt hệ thống</div>
              <div style={{ fontSize: "9px", color: "#9ca3af" }}>Noryx Dynamic Island</div>
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{ width: "22px", height: "22px", borderRadius: "50%", backgroundColor: "rgba(255, 255, 255, 0.08)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#9ca3af" }}
          >
            <X size={12} />
          </button>
        </div>

        {/* Danh sách mục cài đặt */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", position: "relative", zIndex: 2, padding: "6px 0" }}>
          {/* 1. Khởi động cùng Windows */}
          <div
            onClick={handleToggleAutoStart}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: "12px", backgroundColor: "rgba(255, 255, 255, 0.04)", cursor: "pointer" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
              <Power size={15} color={autoStart ? "#22c55e" : "#9ca3af"} />
              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#f3f4f6" }}>Khởi động cùng Win</div>
                <div style={{ fontSize: "9px", color: "#6b7280" }}>{autoStart ? "Tự mở khi bật máy" : "Tắt khi khởi động máy"}</div>
              </div>
            </div>
            {/* iOS Switch */}
            <div style={{ width: "34px", height: "18px", borderRadius: "9999px", backgroundColor: autoStart ? "#22c55e" : "rgba(255,255,255,0.18)", position: "relative", transition: "background-color 0.2s ease" }}>
              <div style={{ width: "14px", height: "14px", borderRadius: "50%", backgroundColor: "#ffffff", position: "absolute", top: "2px", left: autoStart ? "18px" : "2px", transition: "left 0.2s ease", boxShadow: "0 1px 3px rgba(0,0,0,0.4)" }} />
            </div>
          </div>

          {/* 2. Hiệu ứng Liquid Glass */}
          <div
            onClick={handleToggleLiquidGlass}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: "12px", backgroundColor: "rgba(255, 255, 255, 0.04)", cursor: "pointer" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
              <Sparkles size={15} color={liquidGlass ? "#38bdf8" : "#9ca3af"} />
              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#f3f4f6" }}>Hiệu ứng Liquid Glass</div>
                <div style={{ fontSize: "9px", color: "#6b7280" }}>{liquidGlass ? "Kính lỏng khúc xạ" : "Đen tuyền cổ điển"}</div>
              </div>
            </div>
            {/* iOS Switch */}
            <div style={{ width: "34px", height: "18px", borderRadius: "9999px", backgroundColor: liquidGlass ? "#38bdf8" : "rgba(255,255,255,0.18)", position: "relative", transition: "background-color 0.2s ease" }}>
              <div style={{ width: "14px", height: "14px", borderRadius: "50%", backgroundColor: "#ffffff", position: "absolute", top: "2px", left: liquidGlass ? "18px" : "2px", transition: "left 0.2s ease", boxShadow: "0 1px 3px rgba(0,0,0,0.4)" }} />
            </div>
          </div>

          {/* 3. Tự ẩn khi Fullscreen / Xem phim / Chơi Game */}
          <div
            onClick={handleToggleAutoHideFs}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: "12px", backgroundColor: "rgba(255, 255, 255, 0.04)", cursor: "pointer" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
              <Maximize2 size={15} color={autoHideFs ? "#38bdf8" : "#9ca3af"} />
              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#f3f4f6" }}>Tự ẩn khi Fullscreen</div>
                <div style={{ fontSize: "9px", color: "#6b7280" }}>{autoHideFs ? "Tự ẩn khi vào Game / YouTube" : "Luôn luôn hiển thị"}</div>
              </div>
            </div>
            {/* iOS Switch */}
            <div style={{ width: "34px", height: "18px", borderRadius: "9999px", backgroundColor: autoHideFs ? "#38bdf8" : "rgba(255,255,255,0.18)", position: "relative", transition: "background-color 0.2s ease" }}>
              <div style={{ width: "14px", height: "14px", borderRadius: "50%", backgroundColor: "#ffffff", position: "absolute", top: "2px", left: autoHideFs ? "18px" : "2px", transition: "left 0.2s ease", boxShadow: "0 1px 3px rgba(0,0,0,0.4)" }} />
            </div>
          </div>

          {/* 4. Ẩn / Hiện Dynamic Island */}
          <div
            onClick={handleToggleIsland}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: "12px", backgroundColor: "rgba(255, 255, 255, 0.04)", cursor: "pointer" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
              {islandVisible ? <Eye size={15} color="#22c55e" /> : <EyeOff size={15} color="#9ca3af" />}
              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#f3f4f6" }}>Dynamic Island</div>
                <div style={{ fontSize: "9px", color: "#6b7280" }}>{islandVisible ? "Đang hiện trên màn hình" : "Đang tạm ẩn"}</div>
              </div>
            </div>
            <span style={{ fontSize: "10px", fontWeight: 600, color: islandVisible ? "#22c55e" : "#9ca3af", padding: "2px 8px", borderRadius: "6px", backgroundColor: "rgba(255,255,255,0.06)" }}>
              {islandVisible ? "Đang hiện" : "Đang ẩn"}
            </span>
          </div>
        </div>

        {/* Footer: Nút thoát ứng dụng */}
        <div style={{ position: "relative", zIndex: 2, paddingTop: "8px", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
          <button
            onClick={handleExit}
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "10px",
              backgroundColor: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#f87171",
              fontSize: "11px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              cursor: "pointer",
              transition: "background-color 0.15s ease",
            }}
          >
            <LogOut size={13} />
            <span>Thoát ứng dụng</span>
          </button>
        </div>
      </div>
    </div>
  );
}
