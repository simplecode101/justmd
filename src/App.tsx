import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, exists, writeTextFile } from "@tauri-apps/plugin-fs";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import type { EditorMode, ThemeMode } from "./types";
import { Editor, type EditorRef } from "./components/Editor";
import { Preview, type PreviewRef } from "./components/Preview";
import { StatusBar } from "./components/StatusBar";
import { ModeSwitch } from "./components/ModeSwitch";
import { CustomMenu, type MenuItem } from "./components/CustomMenu";
import { WindowControls } from "./components/WindowControls";
import { useAutoSave } from "./hooks/useAutoSave";
import {
  loadSession,
  saveSession,
  loadRecentFiles,
  saveRecentFiles,
  loadTheme,
  saveTheme,
} from "./lib/storage";
import {
  countWords,
  findHeadingNearCursor,
  getFileName,
  isMarkdownFile,
} from "./lib/utils";
import mermaid from "mermaid";
import "./App.css";

const appWindow = getCurrentWebviewWindow();

function getSystemTheme(): ThemeMode {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getEffectiveTheme(theme: ThemeMode | "system"): ThemeMode {
  return theme === "system" ? getSystemTheme() : theme;
}

export default function App() {
  const [content, setContent] = useState("");
  const [filePath, setFilePath] = useState<string | null>(null);
  const [mode, setMode] = useState<EditorMode>("split");
  const [splitRatio, setSplitRatio] = useState(0.5);
  const [theme, setTheme] = useState<ThemeMode | "system">("system");
  const [statusMsg, setStatusMsg] = useState("");
  const [recentFiles, setRecentFiles] = useState(loadRecentFiles());

  const editorRef = useRef<EditorRef>(null);
  const previewRef = useRef<PreviewRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const lastExternalCheckRef = useRef(0);
  const dragTimerRef = useRef<number | null>(null);

  const effectiveTheme = useMemo(() => getEffectiveTheme(theme), [theme]);
  const wordCount = useMemo(() => countWords(content), [content]);
  const fileName = useMemo(() => {
    const name = getFileName(filePath);
    if (!filePath && content.length > 0) return `* ${name}`;
    return name;
  }, [filePath, content]);

  useAutoSave(content, filePath);

  // Initialize
  useEffect(() => {
    const init = async () => {
      mermaid.initialize({ startOnLoad: false, securityLevel: "strict" });

      const savedTheme = loadTheme();
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", getEffectiveTheme(savedTheme) === "dark");

      const session = loadSession();
      if (session?.content !== undefined) {
        setContent(session.content);
      }
      if (session?.filePath) {
        const stillExists = await exists(session.filePath);
        if (stillExists) {
          try {
            const disk = await readTextFile(session.filePath);
            setFilePath(session.filePath);
            setContent(disk);
            setStatusMsg("已恢复上次会话");
          } catch {
            setFilePath(null);
            setStatusMsg("上次文件无法读取");
          }
        } else {
          setStatusMsg("上次打开的文件已不存在");
        }
      }
      if (session?.mode) setMode(session.mode);
      if (session?.splitRatio !== undefined) setSplitRatio(session.splitRatio);
    };
    init();
  }, []);

  // Theme change
  useEffect(() => {
    document.documentElement.classList.toggle("dark", effectiveTheme === "dark");
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: effectiveTheme === "dark" ? "dark" : "default",
    });
    saveTheme(theme);
  }, [theme, effectiveTheme]);

  // Save session
  useEffect(() => {
    saveSession({ filePath, content, mode, splitRatio, theme });
  }, [filePath, content, mode, splitRatio, theme]);

  // Update window title
  useEffect(() => {
    const title = filePath ? `${fileName} - fastmd` : "fastmd";
    appWindow.setTitle(title);
  }, [filePath, fileName]);

  // External modification check (every 3s when file is open)
  useEffect(() => {
    if (!filePath) return;
    const id = setInterval(async () => {
      const now = Date.now();
      if (now - lastExternalCheckRef.current < 3000) return;
      lastExternalCheckRef.current = now;
      try {
        const disk = await readTextFile(filePath);
        if (disk !== content) {
          const ok = window.confirm("文件已在外部修改，是否重新加载？未保存的更改将丢失。");
          if (ok) {
            setContent(disk);
            setStatusMsg("已重新加载外部修改");
          }
        }
      } catch {
        // ignore
      }
    }, 3000);
    return () => clearInterval(id);
  }, [filePath, content]);

  const addRecentFile = useCallback((path: string) => {
    const name = getFileName(path);
    setRecentFiles((prev) => {
      const next = [{ path, name, openedAt: Date.now() }, ...prev.filter((f) => f.path !== path)];
      const limited = next.slice(0, 8);
      saveRecentFiles(limited);
      return limited;
    });
  }, []);

  const handleNew = useCallback(() => {
    setFilePath(null);
    setContent("");
    setStatusMsg("新建文档");
  }, []);

  const handleOpen = useCallback(async () => {
    const selected = await open({
      multiple: false,
      filters: [{ name: "Markdown", extensions: ["md", "markdown"] }],
    });
    if (selected && typeof selected === "string") {
      await loadFile(selected);
    }
  }, []);

  const loadFile = useCallback(async (path: string) => {
    if (!isMarkdownFile(path)) {
      setStatusMsg("仅支持 .md 和 .markdown 文件");
      return;
    }
    try {
      const stillExists = await exists(path);
      if (!stillExists) {
        setStatusMsg("文件不存在");
        setRecentFiles((prev) => {
          const next = prev.filter((f) => f.path !== path);
          saveRecentFiles(next);
          return next;
        });
        return;
      }
      const text = await readTextFile(path);
      setFilePath(path);
      setContent(text);
      addRecentFile(path);
      setStatusMsg(`已打开 ${getFileName(path)}`);
    } catch (err) {
      setStatusMsg("打开文件失败");
      console.error(err);
    }
  }, [addRecentFile]);

  const handleSave = useCallback(async () => {
    if (filePath) {
      try {
        await writeTextFile(filePath, content);
        setStatusMsg("已保存");
      } catch {
        setStatusMsg("保存失败");
      }
    } else {
      handleSaveAs();
    }
  }, [filePath, content]);

  const handleSaveAs = useCallback(async () => {
    const selected = await save({
      filters: [{ name: "Markdown", extensions: ["md"] }],
    });
    if (selected) {
      try {
        await writeTextFile(selected, content);
        setFilePath(selected);
        addRecentFile(selected);
        setStatusMsg("已保存");
      } catch {
        setStatusMsg("保存失败");
      }
    }
  }, [content, addRecentFile]);

  const handleMenuSelect = useCallback(
    (menuLabel: string, itemId: string) => {
      if (menuLabel === "文件") {
        switch (itemId) {
          case "new":
            handleNew();
            break;
          case "open":
            handleOpen();
            break;
          case "save":
            handleSave();
            break;
          case "save_as":
            handleSaveAs();
            break;
          default:
            if (itemId.startsWith("recent:")) {
              loadFile(itemId.slice(7));
            }
            break;
        }
      } else if (menuLabel === "视图") {
        switch (itemId) {
          case "mode_edit":
            setMode("edit");
            break;
          case "mode_split":
            setMode("split");
            break;
          case "mode_preview":
            setMode("preview");
            break;
          case "toggle_theme":
            setTheme((t) => (t === "system" ? "light" : t === "light" ? "dark" : "system"));
            break;
        }
      }
    },
    [handleNew, handleOpen, handleSave, handleSaveAs, loadFile]
  );

  // Drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    containerRef.current?.classList.add("drag-over");
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    containerRef.current?.classList.remove("drag-over");
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      containerRef.current?.classList.remove("drag-over");
      const items = Array.from(e.dataTransfer.files);
      if (items.length > 0) {
        const path = (items[0] as any).path as string;
        if (path) {
          await loadFile(path);
        }
      }
    },
    [loadFile]
  );

  // Scroll sync
  const handleEditorScroll = useCallback(() => {
    if (mode !== "split") return;
    const ta = editorRef.current?.getTextarea();
    if (!ta) return;
    const text = ta.value;
    const cursorLineStart = text.lastIndexOf("\n", ta.selectionStart) + 1;
    const heading = findHeadingNearCursor(text, cursorLineStart);
    if (heading) {
      previewRef.current?.scrollToHeading(heading);
    }
  }, [mode]);

  // Splitter drag
  const handleSplitterMouseDown = useCallback(() => {
    isDraggingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const ratio = (e.clientX - rect.left) / rect.width;
      setSplitRatio(Math.max(0.2, Math.min(0.8, ratio)));
    };
    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Status message auto-clear
  useEffect(() => {
    if (!statusMsg) return;
    const id = setTimeout(() => setStatusMsg(""), 3000);
    return () => clearTimeout(id);
  }, [statusMsg]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        handleNew();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleNew]);

  const fileMenuItems: MenuItem[] = useMemo(() => {
    const items: MenuItem[] = [
      { id: "new", label: "新建", shortcut: "Ctrl+N" },
      { id: "open", label: "打开...", shortcut: "Ctrl+O" },
      { id: "separator-1", label: "", separator: true },
      { id: "save", label: "保存", shortcut: "Ctrl+S" },
      { id: "save_as", label: "另存为...", shortcut: "Ctrl+Shift+S" },
    ];
    if (recentFiles.length > 0) {
      items.push({ id: "separator-2", label: "", separator: true });
      items.push({ id: "recent-header", label: "最近打开", disabled: true });
      for (const f of recentFiles) {
        items.push({ id: `recent:${f.path}`, label: f.name });
      }
    }
    return items;
  }, [recentFiles]);

  const viewMenuItems = useMemo(
    () => [
      { id: "mode_edit", label: "编辑模式", shortcut: "Ctrl+1" },
      { id: "mode_split", label: "编辑+预览", shortcut: "Ctrl+2" },
      { id: "mode_preview", label: "纯预览", shortcut: "Ctrl+3" },
      { id: "separator-1", label: "", separator: true },
      { id: "toggle_theme", label: "切换主题", shortcut: "Ctrl+D" },
    ],
    []
  );

  return (
    <div
      ref={containerRef}
      className={`app ${effectiveTheme === "dark" ? "dark" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <header
        className="app-header"
        onMouseDown={(e) => {
          const target = e.target as HTMLElement;
          const interactive = target.closest("button, input, a, .menu-dropdown, .menu-group");
          if (!interactive) {
            dragTimerRef.current = window.setTimeout(() => {
              appWindow.startDragging();
            }, 200);
          }
        }}
        onDoubleClick={(e) => {
          if (dragTimerRef.current) {
            clearTimeout(dragTimerRef.current);
            dragTimerRef.current = null;
          }
          e.preventDefault();
          window.getSelection()?.removeAllRanges();
          const target = e.target as HTMLElement;
          const interactive = target.closest("button, input, a, .menu-dropdown, .menu-group");
          if (!interactive) {
            appWindow.toggleMaximize();
          }
        }}
      >
        <div className="header-left">
          <span className="app-name">fastmd</span>
          <CustomMenu
            menus={[
              { label: "文件", items: fileMenuItems },
              { label: "视图", items: viewMenuItems },
            ]}
            onSelect={handleMenuSelect}
            isDark={effectiveTheme === "dark"}
          />
        </div>
        <div className="header-center">
          <span className="file-name" title={filePath || undefined}>
            {fileName}
          </span>
        </div>
        <div className="header-right">
          <ModeSwitch mode={mode} onChange={setMode} isDark={effectiveTheme === "dark"} />
          <WindowControls isDark={effectiveTheme === "dark"} />
        </div>
      </header>

      <main className="app-main">
        {(mode === "edit" || mode === "split") && (
          <div
            className="editor-pane"
            style={{ width: mode === "edit" ? "100%" : `${splitRatio * 100}%` }}
          >
            <Editor
              ref={editorRef}
              content={content}
              onChange={setContent}
              isDark={effectiveTheme === "dark"}
              onScroll={handleEditorScroll}
            />
          </div>
        )}
        {mode === "split" && <div className="splitter" onMouseDown={handleSplitterMouseDown} />}
        {(mode === "preview" || mode === "split") && (
          <div
            className="preview-pane"
            style={{ width: mode === "preview" ? "100%" : `${(1 - splitRatio) * 100}%` }}
          >
            <Preview ref={previewRef} content={content} isDark={effectiveTheme === "dark"} />
          </div>
        )}
      </main>

      <StatusBar
        wordCount={wordCount}
        message={statusMsg}
        isDark={effectiveTheme === "dark"}
        theme={theme}
        effectiveTheme={effectiveTheme}
        onThemeChange={setTheme}
      />
    </div>
  );
}
