# justmd

English | [中文](README.md)

> There are surprisingly few dedicated Markdown editors out there. Typora is paid, developer-focused IDEs are bloated with redundant features, online tools are not native desktop apps, and Windows Notepad is just not a pleasant Markdown experience. So I built **justmd** — a lightweight, focused Markdown editor and previewer for everyday users. No feature bloat, just write and read Markdown comfortably.

A minimal desktop Markdown editor powered by Tauri + React + CodeMirror 6.

## Features

- **Three View Modes**: Edit / Split / Preview, with a draggable splitter
- **Professional Editing**: CodeMirror 6 with syntax highlighting, multi-cursor support, find & replace, and auto bracket matching
- **Live Preview**: Powered by react-markdown, supporting GFM, KaTeX math, and Mermaid diagrams
- **Code Highlighting**: highlight.js with support for dozens of programming languages
- **Scroll Sync**: Bidirectional scroll sync between editor and preview panes
- **Quick Formatting**: One-click insertion of H1/H2/H3, bold, italic, underline, and strikethrough
- **Auto Save**: Automatically saves 1.5 seconds after you stop typing
- **Theme Switching**: Follow system / Light / Dark
- **Session Restore**: Automatically restores your last editing session on launch
- **File Association**: Double-click `.md` / `.markdown` files to open directly in justmd
- **Drag & Drop**: Drop a Markdown file into the window to start editing
- **Recent Files**: Quickly reopen recently edited files from the menu

## Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New file |
| `Ctrl+O` | Open file |
| `Ctrl+S` | Save |
| `Ctrl+Shift+S` | Save as |
| `Ctrl+F` | Find |
| `Ctrl+H` | Find & Replace |
| `Ctrl+1/2/3` | Switch Edit / Split / Preview mode |
| `Ctrl+D` | Toggle theme |

## Development

```bash
pnpm install
pnpm dev          # Vite dev server
pnpm tauri dev    # Launch Tauri desktop app
```

## Build

```bash
pnpm build        # Frontend production build
pnpm tauri build  # Package desktop installer
```
