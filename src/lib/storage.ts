import type { Session, RecentFile, ThemeMode, EditorMode } from "../types";

const KEYS = {
  session: "justmd:session",
  recentFiles: "justmd:recent-files",
  theme: "justmd:theme",
  fileModes: "justmd:file-modes",
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
    splitRatio: 0.5,
    theme: "system",
  };
}

export function saveFileMode(path: string, mode: EditorMode) {
  const raw = localStorage.getItem(KEYS.fileModes);
  const map: Record<string, EditorMode> = raw ? JSON.parse(raw) : {};
  map[path] = mode;
  localStorage.setItem(KEYS.fileModes, JSON.stringify(map));
}

export function loadFileMode(path: string): EditorMode | null {
  const raw = localStorage.getItem(KEYS.fileModes);
  if (!raw) return null;
  try {
    const map: Record<string, EditorMode> = JSON.parse(raw);
    return map[path] || null;
  } catch {
    return null;
  }
}
