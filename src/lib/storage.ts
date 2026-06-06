import type { Session, RecentFile, ThemeMode } from "../types";

const KEYS = {
  session: "fastmd:session",
  recentFiles: "fastmd:recent-files",
  theme: "fastmd:theme",
};

export function saveSession(session: Partial<Session>) {
  localStorage.setItem(KEYS.session, JSON.stringify(session));
}

export function loadSession(): Partial<Session> | null {
  const raw = localStorage.getItem(KEYS.session);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveRecentFiles(files: RecentFile[]) {
  localStorage.setItem(KEYS.recentFiles, JSON.stringify(files.slice(0, 8)));
}

export function loadRecentFiles(): RecentFile[] {
  const raw = localStorage.getItem(KEYS.recentFiles);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveTheme(theme: ThemeMode | "system") {
  localStorage.setItem(KEYS.theme, theme);
}

export function loadTheme(): ThemeMode | "system" {
  return (localStorage.getItem(KEYS.theme) as ThemeMode | "system") || "system";
}

export function getDefaultSession(): Session {
  return {
    filePath: null,
    content: "",
    mode: "split",
    splitRatio: 0.5,
    theme: "system",
  };
}
