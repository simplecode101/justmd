import type { ThemeMode } from "../types";

interface ThemeToggleProps {
  theme: ThemeMode | "system";
  effectiveTheme: ThemeMode;
  onChange: (theme: ThemeMode | "system") => void;
}

export function ThemeToggle({ theme, effectiveTheme, onChange }: ThemeToggleProps) {
  const next: Record<ThemeMode | "system", ThemeMode | "system"> = {
    system: "light",
    light: "dark",
    dark: "system",
  };

  const label = theme === "system" ? "自动" : theme === "light" ? "浅色" : "深色";

  return (
    <button
      className="theme-toggle"
      onClick={() => onChange(next[theme])}
      title={`当前: ${label}`}
    >
      {effectiveTheme === "dark" ? "🌙" : "☀️"} {label}
    </button>
  );
}
