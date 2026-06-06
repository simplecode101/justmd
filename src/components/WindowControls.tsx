import { useEffect, useState } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { Minus, Square, X } from "lucide-react";

function getWindow() {
  return getCurrentWebviewWindow();
}

function RestoreIcon() {
  return (
    <svg viewBox="0 0 1024 1024" width="12" height="12">
      <path
        d="M714.666667 256H138.666667a53.393333 53.393333 0 0 0-53.333334 53.333333v576a53.393333 53.393333 0 0 0 53.333334 53.333334h576a53.393333 53.393333 0 0 0 53.333333-53.333334V309.333333a53.393333 53.393333 0 0 0-53.333333-53.333333z m10.666666 629.333333a10.666667 10.666667 0 0 1-10.666666 10.666667H138.666667a10.666667 10.666667 0 0 1-10.666667-10.666667V309.333333a10.666667 10.666667 0 0 1 10.666667-10.666666h576a10.666667 10.666667 0 0 1 10.666666 10.666666z m213.333334-746.666666v565.333333a21.333333 21.333333 0 0 1-42.666667 0V138.666667a10.666667 10.666667 0 0 0-10.666667-10.666667H320a21.333333 21.333333 0 0 1 0-42.666667h565.333333a53.393333 53.393333 0 0 1 53.333334 53.333334z"
        fill="currentColor"
      />
    </svg>
  );
}

export function WindowControls({ isDark }: { isDark: boolean }) {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const window = getWindow();
    const update = async () => {
      setIsMaximized(await window.isMaximized());
    };
    update();
    const unlisten = window.listen("tauri://resize", update);
    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  return (
    <div className={`window-controls ${isDark ? "dark" : ""}`}>
      <button
        className="win-btn minimize"
        onClick={() => getWindow().minimize()}
        title="最小化"
      >
        <Minus size={12} strokeWidth={1.5} />
      </button>
      <button
        className="win-btn maximize"
        onClick={() => getWindow().toggleMaximize()}
        title={isMaximized ? "还原" : "最大化"}
      >
        {isMaximized ? <RestoreIcon /> : <Square size={12} strokeWidth={1.5} />}
      </button>
      <button
        className="win-btn close"
        onClick={() => getWindow().close()}
        title="关闭"
      >
        <X size={12} strokeWidth={1.5} />
      </button>
    </div>
  );
}
