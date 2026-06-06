import { useEffect, useRef, useState } from "react";
import { writeTextFile } from "@tauri-apps/plugin-fs";

export function useAutoSave(content: string, filePath: string | null) {
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");
  const lastSavedContent = useRef(content);
  const lastSavedPath = useRef(filePath);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      lastSavedContent.current = content;
      lastSavedPath.current = filePath;
      initialized.current = true;
      return;
    }

    if (!filePath) {
      setSaveStatus("saved");
      return;
    }
    if (content === lastSavedContent.current && filePath === lastSavedPath.current) {
      setSaveStatus("saved");
      return;
    }

    setSaveStatus("saving");
    const timer = setTimeout(async () => {
      try {
        await writeTextFile(filePath, content);
        lastSavedContent.current = content;
        lastSavedPath.current = filePath;
        setSaveStatus("saved");
      } catch (err) {
        console.error("Auto save failed:", err);
        setSaveStatus("error");
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [content, filePath]);

  return { saveStatus };
}
