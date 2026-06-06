import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { EditorView, basicSetup } from "codemirror";
import { EditorState, Compartment, EditorSelection } from "@codemirror/state";
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

function toggleWrap(view: EditorView, before: string, after: string = before) {
  const { state } = view;
  const changes = state.changeByRange((range) => {
    const textBefore = state.doc.sliceString(
      Math.max(0, range.from - before.length),
      range.from
    );
    const textAfter = state.doc.sliceString(
      range.to,
      Math.min(state.doc.length, range.to + after.length)
    );

    if (textBefore === before && textAfter === after) {
      return {
        changes: [
          { from: range.from - before.length, to: range.from, insert: "" },
          { from: range.to, to: range.to + after.length, insert: "" },
        ],
        range: EditorSelection.range(
          range.from - before.length,
          range.to - before.length
        ),
      };
    }

    const selected = state.doc.sliceString(range.from, range.to);
    const insert = `${before}${selected}${after}`;
    return {
      changes: { from: range.from, to: range.to, insert },
      range: EditorSelection.range(
        range.from + before.length,
        range.to + before.length
      ),
    };
  });
  view.dispatch(changes, { scrollIntoView: true });
  view.focus();
}

function toggleHeading(view: EditorView, level: number) {
  const { state } = view;
  const changes = state.changeByRange((range) => {
    const line = state.doc.lineAt(range.from);
    const match = line.text.match(/^(#{0,6})\s*/);
    const prefix = `${"#".repeat(level)} `;

    if (match) {
      const newText = prefix + line.text.slice(match[0].length);
      return {
        changes: { from: line.from, to: line.to, insert: newText },
        range: EditorSelection.cursor(line.from + prefix.length),
      };
    }

    return { changes: [], range };
  });
  view.dispatch(changes, { scrollIntoView: true });
  view.focus();
}

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

      // Sync gutter width to toolbar padding
      const syncGutterWidth = () => {
        const gutters = container.querySelector(".cm-gutters");
        if (gutters) {
          const width = gutters.getBoundingClientRect().width;
          container.style.setProperty("--gutter-width", `${width}px`);
        }
      };
      syncGutterWidth();

      const ro = new ResizeObserver(syncGutterWidth);
      const gutters = container.querySelector(".cm-gutters");
      if (gutters) ro.observe(gutters);

      return () => {
        ro.disconnect();
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

    return (
      <div className="editor-wrapper">
        <div className={`editor-toolbar ${isDark ? "dark" : ""}`}>
          <button
            className="heading-btn"
            onClick={() => viewRef.current && toggleHeading(viewRef.current, 1)}
            title="H1"
          >
            H1
          </button>
          <button
            className="heading-btn"
            onClick={() => viewRef.current && toggleHeading(viewRef.current, 2)}
            title="H2"
          >
            H2
          </button>
          <button
            className="heading-btn"
            onClick={() => viewRef.current && toggleHeading(viewRef.current, 3)}
            title="H3"
          >
            H3
          </button>
          <button
            onClick={() => viewRef.current && toggleWrap(viewRef.current, "**")}
            title="加粗"
          >
            <strong>B</strong>
          </button>
          <button
            onClick={() => viewRef.current && toggleWrap(viewRef.current, "*")}
            title="斜体"
          >
            <em>I</em>
          </button>
          <button
            onClick={() =>
              viewRef.current && toggleWrap(viewRef.current, "<u>", "</u>")
            }
            title="下划线"
          >
            <u>U</u>
          </button>
          <button
            onClick={() => viewRef.current && toggleWrap(viewRef.current, "~~")}
            title="删除线"
          >
            <s>S</s>
          </button>
        </div>
        <div ref={containerRef} className="editor-content" />
      </div>
    );
  }
);

Editor.displayName = "Editor";
