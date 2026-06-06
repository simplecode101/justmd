import { PenLine, Columns, Eye } from "lucide-react";
import type { EditorMode } from "../types";

interface ModeSwitchProps {
  mode: EditorMode;
  onChange: (mode: EditorMode) => void;
  isDark: boolean;
}

const modes: { key: EditorMode; label: string; icon: React.ReactNode }[] = [
  { key: "edit", label: "编辑", icon: <PenLine size={14} strokeWidth={1.5} /> },
  { key: "split", label: "分屏", icon: <Columns size={14} strokeWidth={1.5} /> },
  { key: "preview", label: "预览", icon: <Eye size={14} strokeWidth={1.5} /> },
];

export function ModeSwitch({ mode, onChange, isDark }: ModeSwitchProps) {
  return (
    <div className={`mode-switch ${isDark ? "dark" : ""}`}>
      {modes.map((m) => (
        <button
          key={m.key}
          className={mode === m.key ? "active" : ""}
          onClick={() => onChange(m.key)}
          title={m.label}
        >
          {m.icon}
        </button>
      ))}
    </div>
  );
}
