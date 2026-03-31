import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { MarkdownViewer } from "../MarkdownViewer";
import { MarkdownToolbar } from "./MarkdownToolbar";

interface MarkdownEditorProps {
  content: string;
  onSave?: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  isSaving?: boolean;
  hasChanges?: boolean;
  view?: "preview" | "wysiwyg";
}

export function MarkdownEditor({
  content,
  onSave,
  disabled = false,
  autoFocus = false,
  isSaving = false,
  hasChanges = false,
  view: externalView,
}: MarkdownEditorProps) {
  const view = externalView ?? "preview";
  const [markdownContent, setMarkdownContent] = useState(content);

  const editor = useEditor({
    extensions: [Markdown, StarterKit],
    content: "",
    contentType: "markdown",
  });

  useEffect(() => {
    console.log(content);
    setMarkdownContent(content);
  }, [content]);

  useEffect(() => {
    if (editor && view === "wysiwyg") {
      editor.commands.setContent(content, { contentType: "markdown" });
    }
  }, [editor, view, content]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled && view === "wysiwyg");
    }
  }, [disabled, view, editor]);

  useEffect(() => {
    if (autoFocus && view === "wysiwyg" && editor) {
      editor.commands.focus();
    }
  }, [autoFocus, view, editor]);

  return (
    <div className="flex flex-col h-full">
      {view == "wysiwyg" && (
        <MarkdownToolbar
          editor={editor}
          disabled={disabled}
          isSaving={isSaving}
          hasChanges={hasChanges}
          onSave={onSave}
        />
      )}

      <div className="flex-1 overflow-hidden">
        {view === "preview" && (
          <div className="h-full overflow-auto p-4">
            <MarkdownViewer content={markdownContent} />
          </div>
        )}

        {view === "wysiwyg" && (
          <div className="h-full overflow-auto">
            <EditorContent
              editor={editor}
              className="h-full [&_.tiptap]:h-full [&_.tiptap]:p-4 [&_.tiptap]:focus:outline-none [&_.tiptap_p]:mb-2 [&_.tiptap_p]:leading-relaxed [&_.tiptap_h1]:text-2xl [&_.tiptap_h1]:font-bold [&_.tiptap_h1]:mb-4 [&_.tiptap_h2]:text-xl [&_.tiptap_h2]:font-bold [&_.tiptap_h2]:mb-3 [&_.tiptap_h3]:text-lg [&_.tiptap_h3]:font-bold [&_.tiptap_h3]:mb-2 [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_blockquote]:border-l-4 [&_.tiptap_blockquote]:border-blue-500 [&_.tiptap_blockquote]:pl-4 [&_.tiptap_blockquote]:italic [&_.tiptap_code]:bg-muted [&_.tiptap_code]:px-1.5 [&_.tiptap_code]:py-0.5 [&_.tiptap_code]:rounded [&_.tiptap_code]:font-mono [&_.tiptap_pre]:bg-muted [&_.tiptap_pre]:p-4 [&_.tiptap_pre]:rounded [&_.tiptap_pre]:overflow-x-auto [&_.tiptap_pre_code]:bg-transparent [&_.tiptap_pre_code]:p-0 [&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.tiptap_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.tiptap_p.is-editor-empty:first-child::before]:float-left [&_.tiptap_p.is-editor-empty:first-child::before]:h-0 [&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}
