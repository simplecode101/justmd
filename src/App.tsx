import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, exists, writeTextFile } from "@tauri-apps/plugin-fs";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { invoke } from "@tauri-apps/api/core";
import type { EditorMode, ThemeMode } from "./types";
import { Editor, type EditorRef } from "./components/Editor";
import { Preview, type PreviewRef } from "./components/Preview";
import { StatusBar } from "./components/StatusBar";
import { ModeSwitch } from "./components/ModeSwitch";
import { CustomMenu, type MenuItem } from "./components/CustomMenu";
import { WindowControls } from "./components/WindowControls";
import appIcon from "./assets/my-icon.png";
import { useAutoSave } from "./hooks/useAutoSave";
import {
  loadSession,
  saveSession,
  loadRecentFiles,
  saveRecentFiles,
  loadTheme,
  saveTheme,
  loadFileMode,
  saveFileMode,
} from "./lib/storage";
import {
  countWords,
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
  const [mode, setMode] = useState<EditorMode>("preview");
  const [splitRatio, setSplitRatio] = useState(0.5);
  const [theme, setTheme] = useState<ThemeMode | "system">("system");
  const [statusMsg, setStatusMsg] = useState("");
  const [recentFiles, setRecentFiles] = useState(loadRecentFiles());
  const [ready, setReady] = useState(false);

  const editorRef = useRef<EditorRef>(null);
  const previewRef = useRef<PreviewRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const lastExternalCheckRef = useRef(0);
  const headerDragRef = useRef<{ x: number; y: number } | null>(null);

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
      const t0 = performance.now();
      const perf = (window as any).__perf || {};
      perf.init = t0;
      const logStep = (label: string) => {
        const ms = Math.round(performance.now() - t0);
        const line = `[init] ${label}: +${ms}ms`;
        invoke("log_frontend", { msg: line });
        console.log(line);
      };

      mermaid.initialize({ startOnLoad: false, securityLevel: "strict" });
      logStep("mermaid init");

      const savedTheme = loadTheme();
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", getEffectiveTheme(savedTheme) === "dark");
      logStep("theme load");

      const session = loadSession();
      logStep("session load");

      if (session?.content !== undefined) {
        setContent(session.content);
        logStep("content restore");
      }
      if (session?.filePath) {
        const stillExists = await exists(session.filePath);
        logStep(`file exists check (${stillExists})`);
        if (stillExists) {
          try {
            const disk = await readTextFile(session.filePath);
            const savedMode = loadFileMode(session.filePath);
            logStep("file read done");
            setFilePath(session.filePath);
            setContent(disk);
            setMode(savedMode ?? "preview");
            setStatusMsg("已恢复上次会话");
          } catch {
            setFilePath(null);
            setMode("preview");
            setStatusMsg("上次文件无法读取");
          }
        } else {
          setFilePath(null);
          setMode("preview");
          setStatusMsg("上次打开的文件已不存在");
        }
      }
      if (session?.splitRatio !== undefined) setSplitRatio(session.splitRatio);
      setReady(true);
      perf.ready = performance.now();
      logStep("ready (total)");

      const total = Math.round(perf.ready);
      const html2js = Math.round((perf.js || perf.html) - perf.html);
      const js2mount = Math.round((perf.mount || perf.js) - (perf.js || perf.html));
      const mount2init = Math.round(perf.init - (perf.mount || perf.js));
      const init2ready = Math.round(perf.ready - perf.init);
      const summary = `[perf] TOTAL=${total}ms | html→js=${html2js}ms | js→mount=${js2mount}ms | mount→init=${mount2init}ms | init→ready=${init2ready}ms`;
      invoke("log_frontend", { msg: summary });
      console.log(summary);
    };
    init();
  }, []);

  // Hide native loading when ready
  useEffect(() => {
    if (!ready) return;
    const loading = document.getElementById("app-loading");
    if (loading) {
      loading.classList.add("hidden");
      setTimeout(() => {
        loading.style.display = "none";
      }, 350);
    }
  }, [ready]);

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
    saveSession({ filePath, content, splitRatio, theme });
  }, [filePath, content, splitRatio, theme]);

  // Save per-file mode
  useEffect(() => {
    if (filePath) {
      saveFileMode(filePath, mode);
    }
  }, [mode, filePath]);

  // Update window title
  useEffect(() => {
    const title = filePath ? `${fileName} - justmd` : "justmd";
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
    setMode("preview");
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
    invoke("log_frontend", { msg: `loadFile: ${path}` });
    if (!isMarkdownFile(path)) {
      setStatusMsg("仅支持 .md 和 .markdown 文件");
      return;
    }
    try {
      const ok = await invoke<boolean>("file_exists", { path });
      if (!ok) {
        setStatusMsg("文件不存在");
        setRecentFiles((prev) => {
          const next = prev.filter((f) => f.path !== path);
          saveRecentFiles(next);
          return next;
        });
        return;
      }
      const text = await invoke<string>("read_file", { path });
      const savedMode = loadFileMode(path);
      setFilePath(path);
      setContent(text);
      setMode(savedMode ?? "preview");
      addRecentFile(path);
      setStatusMsg(`已打开 ${getFileName(path)}`);
    } catch (err) {
      setStatusMsg("打开文件失败: " + String(err));
    }
  }, [addRecentFile]);

  // File association: Rust stores CLI file path in PendingFile state.
  // Cold start: retrieve on mount.
  // Hot start: poll every 500ms for new pending files.
  useEffect(() => {
    const poll = () => {
      invoke<string | null>("get_pending_file")
        .then((path) => {
          invoke("log_frontend", { msg: `poll result: ${path ?? "null"}` });
          if (path) loadFile(path);
        })
        .catch((e) => {
          invoke("log_frontend", { msg: `poll error: ${String(e)}` });
        });
    };
    poll();
    const interval = setInterval(poll, 500);
    return () => clearInterval(interval);
  }, [loadFile]);

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

  // Drag and drop via Tauri native API (more reliable than DOM events)
  useEffect(() => {
    const unlisten = appWindow.onDragDropEvent((event) => {
      const { type } = event.payload;
      if (type === "enter" || type === "over") {
        containerRef.current?.classList.add("drag-over");
      } else if (type === "leave") {
        containerRef.current?.classList.remove("drag-over");
      } else if (type === "drop") {
        containerRef.current?.classList.remove("drag-over");
        const paths = event.payload.paths;
        if (paths.length > 0) {
          loadFile(paths[0]);
        }
      }
    });
    return () => {
      unlisten.then((f) => f());
    };
  }, [loadFile]);

  // Scroll sync
  const handleEditorScroll = useCallback(
    (ratio: number) => {
      if (mode !== "split") return;
      previewRef.current?.scrollToRatio(ratio);
    },
    [mode]
  );

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

  // Header drag: movement-based detection (not time-based).
  // On mousedown we record the starting position; once the cursor moves
  // more than 3px the OS native drag is triggered immediately.
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!headerDragRef.current) return;
      const dx = e.clientX - headerDragRef.current.x;
      const dy = e.clientY - headerDragRef.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        headerDragRef.current = null;
        appWindow.startDragging();
      }
    };
    const handleMouseUp = () => {
      headerDragRef.current = null;
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
      { id: "mode_preview", label: "预览模式", shortcut: "Ctrl+1" },
      { id: "mode_split", label: "双屏模式", shortcut: "Ctrl+2" },
      { id: "separator-1", label: "", separator: true },
      { id: "toggle_theme", label: "切换主题", shortcut: "Ctrl+D" },
    ],
    []
  );

  return (
    <div
      ref={containerRef}
      className={`app ${effectiveTheme === "dark" ? "dark" : ""} ${ready ? "ready" : ""}`}
    >
      <header
        className="app-header"
        onMouseDown={(e) => {
          const target = e.target as HTMLElement;
          const interactive = target.closest("button, input, a, .menu-dropdown, .menu-group");
          if (!interactive) {
            headerDragRef.current = { x: e.clientX, y: e.clientY };
          }
        }}
        onDoubleClick={(e) => {
          headerDragRef.current = null;
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
          <img src={appIcon} alt="justmd" className="app-icon" />
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
        {mode === "split" && (
          <div
            className="editor-pane"
            style={{ width: `${splitRatio * 100}%` }}
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
