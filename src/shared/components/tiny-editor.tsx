"use client";

import { useEffect, useRef, useState, useId } from "react";
import { useTheme } from "next-themes";
import { Loader2, Code2, Eye } from "lucide-react";

declare global {
  interface Window {
    tinymce?: any;
  }
}

interface TinyEditorProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
  disabled?: boolean;
}

let scriptLoadPromise: Promise<void> | null = null;

function loadTinyMceScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.tinymce) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise<void>((resolve, reject) => {
    // Check if already in DOM
    const existing = document.querySelector('script[src*="tinymce"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load TinyMCE")));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.8.3/tinymce.min.js";
    script.referrerPolicy = "origin";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load TinyMCE script"));
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

export function TinyEditor({
  id: propId,
  value,
  onChange,
  placeholder = "พิมพ์หรือวางเนื้อหาข่าวที่นี่...",
  height = 360,
  disabled = false,
}: TinyEditorProps) {
  const autoId = useId().replace(/:/g, "_");
  const editorId = propId || `tiny_editor_${autoId}`;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<any>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [viewSource, setViewSource] = useState(false);

  // Keep track of internal content to avoid infinite loops and cursor jumps
  const internalValueRef = useRef(value);

  // Initialize TinyMCE
  useEffect(() => {
    let isCancelled = false;

    loadTinyMceScript()
      .then(() => {
        if (isCancelled || !window.tinymce || !textareaRef.current) return;

        // Remove previous instance if exists
        const existingEditor = window.tinymce.get(editorId);
        if (existingEditor) {
          existingEditor.remove();
        }

        window.tinymce.init({
          target: textareaRef.current,
          height,
          menubar: false,
          branding: false,
          promotion: false,
          statusbar: true,
          placeholder,
          skin: isDark ? "oxide-dark" : "oxide",
          content_css: isDark ? "dark" : "default",
          plugins: [
            "advlist",
            "autolink",
            "lists",
            "link",
            "image",
            "charmap",
            "preview",
            "searchreplace",
            "visualblocks",
            "code",
            "fullscreen",
            "table",
            "wordcount",
          ],
          toolbar:
            "undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | table link image | removeformat code fullscreen",
          content_style: `
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Sarabun", sans-serif;
              font-size: 14px;
              line-height: 1.6;
              padding: 12px;
              color: ${isDark ? "#f1f5f9" : "#0f172a"};
              background-color: ${isDark ? "#090d16" : "#ffffff"};
            }
            p { margin-bottom: 0.75rem; }
            h1, h2, h3, h4 { font-weight: 700; margin-top: 1rem; margin-bottom: 0.5rem; }
            a { color: #d97706; text-decoration: underline; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 1rem; }
            table td, table th { border: 1px solid ${isDark ? "#334155" : "#cbd5e1"}; padding: 6px 10px; }
          `,
          setup: (editor: any) => {
            editorRef.current = editor;

            editor.on("init", () => {
              if (isCancelled) return;
              setIsReady(true);
              if (value && editor.getContent() !== value) {
                editor.setContent(value);
              }
              if (disabled) {
                editor.mode.set("readonly");
              }
            });

            editor.on("change input keyup Undo Redo", () => {
              const content = editor.getContent();
              internalValueRef.current = content;
              onChange(content);
            });
          },
        });
      })
      .catch((err) => {
        console.warn("Could not initialize TinyMCE, fallback to standard textarea:", err);
        setLoadError(true);
      });

    return () => {
      isCancelled = true;
      if (window.tinymce && editorRef.current) {
        try {
          editorRef.current.remove();
        } catch {
          // ignore
        }
        editorRef.current = null;
      }
    };
    // Re-initialize if dark mode changes
  }, [editorId, isDark]);

  // Sync external value changes (e.g. from Gemini AI translate or reset)
  useEffect(() => {
    if (editorRef.current && isReady) {
      const currentContent = editorRef.current.getContent();
      if (value !== currentContent && value !== internalValueRef.current) {
        internalValueRef.current = value;
        editorRef.current.setContent(value || "");
      }
    }
  }, [value, isReady]);

  // Update disabled state
  useEffect(() => {
    if (editorRef.current && isReady) {
      editorRef.current.mode.set(disabled ? "readonly" : "design");
    }
  }, [disabled, isReady]);

  return (
    <div className="tiny-editor-wrapper relative rounded-lg border border-input bg-background overflow-hidden">
      {/* View Source / Visual Toggle Header Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/40 border-b border-border text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>Tiny Editor (WYSIWYG Rich Text)</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              if (viewSource && editorRef.current) {
                editorRef.current.setContent(value);
              }
              setViewSource(!viewSource);
            }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            title={viewSource ? "สลับกลับสู่มุมมองตกแต่งข้อความ" : "ดู/แก้ไขโค้ด HTML โดยตรง"}
          >
            {viewSource ? (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>มุมมองปกติ (Visual)</span>
              </>
            ) : (
              <>
                <Code2 className="w-3.5 h-3.5" />
                <span>แก้ไขโค้ด HTML</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Loading state indicator */}
      {!isReady && !loadError && !viewSource && (
        <div className="absolute inset-0 top-8 z-10 flex items-center justify-center bg-background/80 backdrop-blur-xs text-xs text-muted-foreground gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
          <span>กำลังโหลด Tiny Editor...</span>
        </div>
      )}

      {/* Editor Body */}
      {viewSource ? (
        <textarea
          value={value}
          onChange={(e) => {
            internalValueRef.current = e.target.value;
            onChange(e.target.value);
          }}
          disabled={disabled}
          placeholder="แก้ไขโค้ด HTML ของเนื้อหาข่าวโดยตรง..."
          style={{ height: `${height}px` }}
          className="w-full p-3 font-mono text-xs focus:outline-none bg-background text-foreground resize-y leading-relaxed"
        />
      ) : (
        <div style={{ minHeight: `${height}px` }}>
          <textarea
            ref={textareaRef}
            id={editorId}
            defaultValue={value}
            disabled={disabled}
            placeholder={placeholder}
            style={{ width: "100%", height: `${height}px`, display: isReady ? "none" : "block" }}
            className="w-full p-3 text-sm focus:outline-none bg-background text-foreground resize-y"
          />
        </div>
      )}
    </div>
  );
}
