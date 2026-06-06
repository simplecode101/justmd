# justmd

中文 | [English](README_EN.md)

> 找了一圈发现，真正纯粹的 Markdown 编辑器并不多。Typora 开始收费了，VS Code 这类工具又太「程序员向」，在线编辑器不是本地应用，Windows 记事本写 Markdown 又实在难受。于是就有了 justmd——一个简单、轻量的本地 Markdown 编辑器，没有花哨的功能，就是让你舒服地写、舒服地看。

一个极简的桌面 Markdown 编辑器，基于 Tauri + React + CodeMirror 6。  

## 功能

- **三态切换**：编辑 / 编辑+预览 / 纯预览，比例可拖拽调整
- **专业编辑体验**：CodeMirror 6 驱动，支持语法高亮、多光标、查找替换、自动括号匹配
- **实时预览**：基于 react-markdown，支持 GFM、KaTeX 数学公式、Mermaid 图表
- **代码高亮**：highlight.js 语法高亮，支持数十种编程语言
- **滚动同步**：编辑区和预览区双向滚动联动
- **快捷格式化**：一键插入 H1/H2/H3、加粗、斜体、下划线、删除线
- **自动保存**：停止输入 1.5 秒后自动写入
- **主题切换**：跟随系统 / 浅色 / 深色
- **会话恢复**：启动时自动恢复上次编辑状态
- **文件关联**：双击 `.md` / `.markdown` 文件直接用 justmd 打开
- **拖拽打开**：把 Markdown 文件拖进窗口即可编辑
- **最近文件**：菜单中快速访问最近打开的文件

## 开发

```bash
pnpm install
pnpm dev          # 前端 Vite 开发服务器
pnpm tauri dev    # 启动 Tauri 桌面应用
```

## 构建

```bash
pnpm build        # 前端生产构建
pnpm tauri build  # 打包桌面应用安装包
```
