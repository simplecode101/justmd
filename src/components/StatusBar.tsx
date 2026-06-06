import { ThemeToggle } from "./ThemeToggle";
import type { ThemeMode } from "../types";

interface StatusBarProps {
  wordCount: number;
  message?: string;
  isDark: boolean;
  theme: ThemeMode | "system";
  effectiveTheme: ThemeMode;
  onThemeChange: (theme: ThemeMode | "system") => void;
}

export function StatusBar({
  wordCount,
  message,
  isDark,
  theme,
  effectiveTheme,
  onThemeChange,
}: StatusBarProps) {
  return (
    <div className={`status-bar ${isDark ? "dark" : ""}`}>
      <span className="status-count">{wordCount.toLocaleString()} 字</span>
      {message && <span className="status-message">{message}</span>}
      <ThemeToggle theme={theme} effectiveTheme={effectiveTheme} onChange={onThemeChange} />
    </div>
  );
}
