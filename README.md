# fastmd

一个极简的桌面 Markdown 编辑器，基于 Tauri + React + TypeScript。

## 功能

- **三态切换**：编辑 / 编辑+预览 / 纯预览
- **左右分屏**：比例可拖拽调整
- **原生编辑体验**：纯文本编辑，搜索替换
- **实时预览**：基于 react-markdown，支持 GFM、KaTeX 数学公式、Mermaid 图表
- **Shiki 代码高亮**：VS Code 同款高亮引擎
- **自动保存**：停止输入 1.5 秒后自动写入
- **主题切换**：跟随系统 / 浅色 / 深色
- **会话恢复**：启动时自动恢复上次编辑状态
- **原生桌面体验**：系统菜单、拖拽打开、最近文件

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+N` | 新建 |
| `Ctrl+O` | 打开 |
| `Ctrl+S` | 保存 |
| `Ctrl+Shift+S` | 另存为 |
| `Ctrl+F` | 查找 |
| `Ctrl+H` | 查找替换 |
| `Ctrl+1/2/3` | 切换编辑/分屏/预览模式 |
| `Ctrl+D` | 切换主题 |

## 开发

```bash
pnpm install
pnpm tauri dev
```

## 构建

```bash
pnpm tauri build
```
