import { useEffect, useId, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import mermaid from "mermaid";
import "katex/dist/katex.min.css";

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
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
        components={{
          code(props) {
            const { className, children, inline } = props as {
              className?: string;
              children: ReactNode;
              inline?: boolean;
            };
            if (inline) {
              return <code className={className}>{children}</code>;
            }
            const match = /language-(\w+)/.exec(className || "");
            const lang = match ? match[1] : "";
            if (lang === "mermaid") {
              return <MermaidBlock code={String(children).replace(/\n$/, "")} />;
            }
            return <code className={className}>{children}</code>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
