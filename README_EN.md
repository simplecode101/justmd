# justmd

English | [中文](README.md)

> I looked around and realized there aren't many dedicated Markdown editors out there. Typora went paid, VS Code is too developer-centric, online editors aren't native apps, and Windows Notepad is just painful for Markdown. So I built justmd — a simple, lightweight local Markdown editor. No bloat, no fuss, just a pleasant place to write and read.

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
