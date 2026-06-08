export type EditorMode = "split" | "preview";
export type ThemeMode = "light" | "dark";

export interface Session {
  filePath: string | null;
  content: string;
  splitRatio: number;
  theme: ThemeMode | "system";
}

export interface RecentFile {
  path: string;
  name: string;
  openedAt: number;
}
