import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { EditorView, basicSetup } from "codemirror";
import { EditorState, Compartment } from "@codemirror/state";
import { markdown } from "@codemirror/lang-markdown";

interface EditorProps {
  content: string;
  onChange: (value: string) => void;
  isDark: boolean;
  readOnly?: boolean;
  onScroll?: (ratio: number) => void;
}

export interface EditorRef {
  focus: () => void;
  getView: () => EditorView | undefined;
}

const themeCompartment = new Compartment();

const baseTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "14px",
  },
  ".cm-content": {
    fontFamily:
      'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
    padding: "12px 16px",
    lineHeight: "1.6",
    caretColor: "var(--editor-fg)",
  },
  ".cm-gutters": {
    fontFamily:
      'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
    borderRight: "1px solid var(--border)",
    backgroundColor: "var(--editor-bg)",
    color: "var(--editor-fg)",
  },
  ".cm-lineNumbers .cm-gutterElement": {
    padding: "0 8px 0 0",
    lineHeight: "1.6",
    minHeight: "calc(14px * 1.6)",
    opacity: "0.3",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "transparent",
    opacity: "1",
  },
  ".cm-activeLine": {
    backgroundColor: "transparent",
  },
  ".cm-cursor": {
    borderLeftColor: "var(--editor-fg)",
  },
  ".cm-selectionBackground": {
    background: "var(--button-active-bg)",
    opacity: "0.3",
  },
  "&.cm-focused .cm-selectionBackground": {
    background: "var(--button-active-bg)",
    opacity: "0.4",
  },
  "&.cm-focused .cm-cursor": {
    borderLeftColor: "var(--editor-fg)",
  },
  ".cm-scroller": {
    backgroundColor: "var(--editor-bg)",
    color: "var(--editor-fg)",
  },
  ".cm-scroller::-webkit-scrollbar": {
    width: "5px",
  },
  ".cm-scroller::-webkit-scrollbar-track": {
    background: "transparent",
  },
  ".cm-scroller::-webkit-scrollbar-thumb": {
    background: "transparent",
    borderRadius: "3px",
  },
  "&:hover .cm-scroller::-webkit-scrollbar-thumb": {
    background: "var(--border)",
  },
  ".cm-scroller::-webkit-scrollbar-thumb:hover": {
    background: "var(--fg)",
    opacity: "0.2",
  },
});

const lightTheme = EditorView.theme({}, { dark: false });
const darkTheme = EditorView.theme({}, { dark: true });

function createExtensions(
  isDark: boolean,
  readOnly: boolean | undefined,
  onChange: (v: string) => void,
  onScroll?: (ratio: number) => void
) {
  const extensions = [
    themeCompartment.of(isDark ? darkTheme : lightTheme),
    baseTheme,
    basicSetup,
    markdown(),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onChange(update.state.doc.toString());
      }
    }),
    EditorState.readOnly.of(readOnly ?? false),
  ];

  if (onScroll) {
    extensions.push(
      EditorView.domEventHandlers({
        scroll(_event, view) {
          const scroller = view.scrollDOM;
          const maxScroll = scroller.scrollHeight - scroller.clientHeight;
          if (maxScroll > 0) {
            onScroll(scroller.scrollTop / maxScroll);
          }
          return false;
        },
      })
    );
  }

  return extensions;
}

export const Editor = forwardRef<EditorRef, EditorProps>(
  ({ content, onChange, isDark, readOnly, onScroll }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | undefined>(undefined);

    useImperativeHandle(ref, () => ({
      focus: () => viewRef.current?.focus(),
      getView: () => viewRef.current,
    }));

    // Initialize once
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const state = EditorState.create({
        doc: content,
        extensions: createExtensions(isDark, readOnly, onChange, onScroll),
      });

      const view = new EditorView({
        state,
        parent: container,
      });

      viewRef.current = view;

      return () => {
        view.destroy();
        viewRef.current = undefined;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sync content from props
    useEffect(() => {
      const view = viewRef.current;
      if (!view) return;
      const current = view.state.doc.toString();
      if (content !== current) {
        view.dispatch({
          changes: { from: 0, to: current.length, insert: content },
        });
      }
    }, [content]);

    // Sync theme
    useEffect(() => {
      const view = viewRef.current;
      if (!view) return;
      view.dispatch({
        effects: themeCompartment.reconfigure(isDark ? darkTheme : lightTheme),
      });
    }, [isDark]);

    return <div ref={containerRef} className="editor-wrapper" />;
  }
);

Editor.displayName = "Editor";
