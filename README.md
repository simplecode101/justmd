# justmd

English | [中文](README_CN.md)

I often write in Markdown, read Markdown, and share Markdown files with other people.

When the person on the other end isn't a developer, there's a good chance they'll ask:

"How do I open this?"

And somehow, I never have a good answer.

I could tell them Markdown is just a simple markup language and that they can open it in Notepad. I could tell them to ignore all the #s and *s. But that sounds ridiculous.

I could recommend Typora, then realize it's paid. Or send them to an online Markdown previewer and tell them to paste the content there.

None of those feel like the right answer.

People keep saying Markdown is simple. That it's all most people need. That it makes writing easier.

Maybe that's true.

But if Markdown is really that good, shouldn't opening a Markdown file be as easy as opening a PDF?

You double-click it. It opens. That's it.

That's why I built justmd.

Markdown shouldn't need explaining how to open.


A minimal desktop Markdown editor powered by Tauri + React + CodeMirror 6.

## Features

- **Three View Modes**: Edit / Edit+Preview / Preview
- **Live Preview**: GFM, KaTeX math, and Mermaid diagrams
- **Code Highlighting**: highlight.js with support for dozens of programming languages
- **Scroll Sync**: Bidirectional scroll sync between editor and preview panes
- **Theme Switching**: Follow system / Light / Dark

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
