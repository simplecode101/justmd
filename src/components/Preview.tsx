import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { MarkdownRenderer } from "../lib/markdown";

interface PreviewProps {
  content: string;
  isDark: boolean;
}

export interface PreviewRef {
  scrollToHeading: (headingText: string) => void;
  scrollToRatio: (ratio: number) => void;
  getContainer: () => HTMLDivElement | null;
}

export const Preview = forwardRef<PreviewRef, PreviewProps>(
  ({ content, isDark }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      scrollToHeading: (headingText: string) => {
        const container = containerRef.current;
        if (!container) return;
        const anchors = container.querySelectorAll("h1, h2, h3, h4, h5, h6");
        for (const anchor of anchors) {
          const text = anchor.textContent?.trim().toLowerCase() || "";
          if (text === headingText.toLowerCase()) {
            anchor.scrollIntoView({ behavior: "auto", block: "start" });
            break;
          }
        }
      },
      scrollToRatio: (ratio: number) => {
        const container = containerRef.current;
        if (!container) return;
        const maxScroll = container.scrollHeight - container.clientHeight;
        if (maxScroll > 0) {
          container.scrollTop = ratio * maxScroll;
        }
      },
      getContainer: () => containerRef.current,
    }));

    useEffect(() => {
      const linkId = "hljs-theme";
      let link = document.getElementById(linkId) as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.id = linkId;
        link.rel = "stylesheet";
        document.head.appendChild(link);
      }
      link.href = isDark ? "/hljs-dark.css" : "/hljs-light.css";
    }, [isDark]);

    return (
      <div ref={containerRef} className="preview-wrapper">
        <MarkdownRenderer content={content} isDark={isDark} />
      </div>
    );
  }
);

Preview.displayName = "Preview";
