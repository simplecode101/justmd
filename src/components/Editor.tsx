import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";

interface EditorProps {
  content: string;
  onChange: (value: string) => void;
  isDark: boolean;
  readOnly?: boolean;
  onScroll?: () => void;
}

export interface EditorRef {
  focus: () => void;
  getTextarea: () => HTMLTextAreaElement | null;
}

export const Editor = forwardRef<EditorRef, EditorProps>(
  ({ content, onChange, isDark, readOnly, onScroll }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [findOpen, setFindOpen] = useState(false);

    useImperativeHandle(ref, () => ({
      focus: () => textareaRef.current?.focus(),
      getTextarea: () => textareaRef.current,
    }));
    const [findText, setFindText] = useState("");
    const [replaceText, setReplaceText] = useState("");
    const [caseSensitive, setCaseSensitive] = useState(false);

    useEffect(() => {
      const handler = (e: KeyboardEvent) => {
        if (e.key === "f" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          setFindOpen(true);
          setTimeout(() => {
            document.getElementById("find-input")?.focus();
          }, 10);
        }
        if (e.key === "h" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          setFindOpen(true);
          setTimeout(() => {
            document.getElementById("find-input")?.focus();
          }, 10);
        }
        if (e.key === "Escape" && findOpen) {
          setFindOpen(false);
          textareaRef.current?.focus();
        }
      };
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }, [findOpen]);

    const handleFindNext = () => {
      const ta = textareaRef.current;
      if (!ta || !findText) return;
      const text = ta.value;
      const flags = caseSensitive ? "g" : "gi";
      const regex = new RegExp(escapeRegExp(findText), flags);
      const start = ta.selectionEnd;
      const match = regex.exec(text.slice(start));
      if (match) {
        const pos = start + match.index;
        ta.setSelectionRange(pos, pos + match[0].length);
        ta.focus();
        ta.scrollTop = ta.scrollHeight * (ta.selectionStart / text.length);
      } else {
        const wrapMatch = regex.exec(text);
        if (wrapMatch) {
          ta.setSelectionRange(wrapMatch.index, wrapMatch.index + wrapMatch[0].length);
          ta.focus();
        }
      }
    };

    const handleReplace = () => {
      const ta = textareaRef.current;
      if (!ta || !findText) return;
      const text = ta.value;
      const flags = caseSensitive ? "g" : "gi";
      const regex = new RegExp(escapeRegExp(findText), flags);
      const start = ta.selectionStart;
      const match = regex.exec(text.slice(start));
      if (match) {
        const pos = start + match.index;
        const before = text.slice(0, pos);
        const after = text.slice(pos + match[0].length);
        const newValue = before + replaceText + after;
        onChange(newValue);
        setTimeout(() => {
          ta.setSelectionRange(pos + replaceText.length, pos + replaceText.length);
          ta.focus();
        }, 0);
      }
    };

    const handleReplaceAll = () => {
      const ta = textareaRef.current;
      if (!ta || !findText) return;
      const text = ta.value;
      const flags = caseSensitive ? "g" : "gi";
      const regex = new RegExp(escapeRegExp(findText), flags);
      const newValue = text.replace(regex, replaceText);
      if (newValue !== text) {
        onChange(newValue);
      }
    };

    return (
      <div className="editor-wrapper">
        <textarea
          ref={textareaRef}
          className={`editor-textarea ${isDark ? "dark" : ""}`}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onScroll={onScroll}
          readOnly={readOnly}
          spellCheck={false}
        />
        {findOpen && (
          <div className={`find-replace-box ${isDark ? "dark" : ""}`}>
            <input
              id="find-input"
              type="text"
              placeholder="查找"
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleFindNext();
              }}
            />
            <input
              type="text"
              placeholder="替换"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleReplace();
              }}
            />
            <label>
              <input
                type="checkbox"
                checked={caseSensitive}
                onChange={(e) => setCaseSensitive(e.target.checked)}
              />
              区分大小写
            </label>
            <button onClick={handleFindNext}>查找下一个</button>
            <button onClick={handleReplace}>替换</button>
            <button onClick={handleReplaceAll}>全部替换</button>
            <button onClick={() => setFindOpen(false)}>关闭</button>
          </div>
        )}
      </div>
    );
  }
);

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

Editor.displayName = "Editor";
