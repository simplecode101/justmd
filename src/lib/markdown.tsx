import { useEffect, useId, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { createHighlighter } from "shiki";
import mermaid from "mermaid";
import "katex/dist/katex.min.css";

let highlighterPromise: ReturnType<typeof createHighlighter> | null = null;

async function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-light", "github-dark"],
      langs: [
        "javascript",
        "typescript",
        "tsx",
        "jsx",
        "json",
        "html",
        "css",
        "scss",
        "python",
        "rust",
        "go",
        "bash",
        "shell",
        "sql",
        "yaml",
        "toml",
        "markdown",
        "mdx",
        "vue",
        "svelte",
        "java",
        "c",
        "cpp",
        "csharp",
        "php",
        "ruby",
        "swift",
        "kotlin",
        "dart",
      ],
    });
  }
  return highlighterPromise;
}

function CodeBlock({
  className,
  children,
  isDark,
}: {
  className?: string;
  children: React.ReactNode;
  isDark: boolean;
}) {
  const [html, setHtml] = useState<string>("");
  const match = /language-(\w+)/.exec(className || "");
  const lang = match ? match[1] : "text";
  const code = String(children).replace(/\n$/, "");

  useEffect(() => {
    let cancelled = false;
    getHighlighter().then((highlighter) => {
      if (cancelled) return;
      const theme = isDark ? "github-dark" : "github-light";
      const rendered = highlighter.codeToHtml(code, {
        lang: highlighter.getLoadedLanguages().includes(lang as never)
          ? (lang as never)
          : "text",
        theme: theme as never,
      });
      setHtml(rendered);
    });
    return () => {
      cancelled = true;
    };
  }, [code, lang, isDark]);

  if (!html) {
    return (
      <pre className={className}>
        <code>{children}</code>
      </pre>
    );
  }

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

function MermaidBlock({ code }: { code: string }) {
  const id = useId().replace(/:/g, "-");
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    mermaid
      .render(`mermaid-${id}`, code, undefined)
      .then(({ svg }) => {
        if (!cancelled) setSvg(svg);
      })
      .catch((err) => {
        if (!cancelled) setError(String(err?.message || "图表渲染失败"));
      });
    return () => {
      cancelled = true;
    };
  }, [code, id]);

  if (error) {
    return <pre className="mermaid-error">{error}</pre>;
  }
  if (!svg) {
    return <div className="mermaid-loading">渲染中...</div>;
  }
  return <div className="mermaid" dangerouslySetInnerHTML={{ __html: svg }} />;
}

interface MarkdownRendererProps {
  content: string;
  isDark: boolean;
}

export function MarkdownRenderer({ content, isDark }: MarkdownRendererProps) {
  return (
    <div className={`markdown-body ${isDark ? "dark" : ""}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({ className, children }) {
            const match = /language-(\w+)/.exec(className || "");
            const lang = match ? match[1] : "";
            if (lang === "mermaid") {
              return <MermaidBlock code={String(children).replace(/\n$/, "")} />;
            }
            return (
              <CodeBlock className={className} isDark={isDark}>
                {children}
              </CodeBlock>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
