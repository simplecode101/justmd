export function getFileName(path: string | null): string {
  if (!path) return "* 未命名";
  const parts = path.replace(/\\/g, "/").split("/");
  return parts[parts.length - 1] || "* 未命名";
}

export function countWords(text: string): number {
  // Count Chinese characters and word-like tokens
  const cn = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const en = (text.match(/[a-zA-Z0-9_]+/g) || []).length;
  return cn + en;
}

export function extractVisibleHeadings(text: string): string[] {
  const headings: string[] = [];
  const lines = text.split("\n");
  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      headings.push(match[2].trim());
    }
  }
  return headings;
}

export function findHeadingNearCursor(text: string, cursorPos: number): string | null {
  const before = text.slice(0, cursorPos);
  const lines = before.split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    const match = lines[i].match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      return match[2].trim();
    }
  }
  return null;
}

export function isMarkdownFile(path: string): boolean {
  const lower = path.toLowerCase();
  return lower.endsWith(".md") || lower.endsWith(".markdown");
}
