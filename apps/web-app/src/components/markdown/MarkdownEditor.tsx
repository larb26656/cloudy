import { useEffect, useCallback, useState, useRef } from "react";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";
import type { MarkdownStorage } from "tiptap-markdown";
import { Button } from "@/components/ui/button";
import { MarkdownViewer } from "./MarkdownViewer";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Edit3,
  Eye,
  FileCode,
  Save,
  Undo,
  Redo,
} from "lucide-react";
import { cn } from "@/lib/utils";

type EditorView = "preview" | "wysiwyg" | "source";

interface CustomEditor extends Editor {
  storage: Editor["storage"] & { markdown: MarkdownStorage };
}

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave?: () => void;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  isSaving?: boolean;
  hasChanges?: boolean;
}

const tabs: { id: EditorView; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "preview", label: "Preview", icon: Eye },
  { id: "wysiwyg", label: "Edit", icon: Edit3 },
  { id: "source", label: "Markdown", icon: FileCode },
];

export function MarkdownEditor({
  content,
  onChange,
  onSave,
  disabled = false,
  placeholder = "Start writing...",
  autoFocus = false,
  isSaving = false,
  hasChanges = false,
}: MarkdownEditorProps) {
  const [view, setView] = useState<EditorView>("preview");
  const [markdownContent, setMarkdownContent] = useState(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastContentRef = useRef<string>("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Markdown.configure({
        html: false,
        transformPastedText: true,
        transformCopiedText: false,
      }),
    ],
    content: "",
    editable: !disabled && view === "wysiwyg",
    onUpdate: ({ editor }) => {
      const customEditor = editor as CustomEditor;
      const markdown = customEditor.storage.markdown.getMarkdown();
      setMarkdownContent(markdown);
      onChange(markdown);
    },
  });

  useEffect(() => {
    setMarkdownContent(content);
    lastContentRef.current = content;
  }, [content]);

  useEffect(() => {
    if (editor && view === "wysiwyg") {
      if (content !== lastContentRef.current) {
        editor.commands.setContent(content);
        lastContentRef.current = content;
      }
    }
  }, [editor, view, content]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled && view === "wysiwyg");
    }
  }, [disabled, view, editor]);

  useEffect(() => {
    if (view === "source" && editor) {
      const markdown = (editor as CustomEditor).storage.markdown.getMarkdown();
      setMarkdownContent(markdown);
    }
  }, [view, editor]);

  useEffect(() => {
    if (autoFocus && view === "wysiwyg" && editor) {
      editor.commands.focus();
    } else if (autoFocus && view === "source" && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus, view, editor]);

  const handleMarkdownChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value;
      setMarkdownContent(newContent);
      onChange(newContent);

      if (editor) {
        editor.commands.setContent(newContent);
      }
    },
    [onChange, editor],
  );

  const ToolbarButton = ({
    onClick,
    icon: Icon,
    label,
    isDisabled,
  }: {
    onClick: () => void;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    isDisabled?: boolean;
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={onClick}
      disabled={isDisabled || disabled || view !== "wysiwyg" || !editor}
      title={label}
    >
      <Icon className="size-4" />
    </Button>
  );

  const isEditing = view === "wysiwyg" || view === "source";

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1 border-b p-2 flex-wrap">
        {view === "wysiwyg" && editor && (
          <>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              icon={Bold}
              label="Bold"
              isDisabled={!editor.can().chain().focus().toggleBold().run()}
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              icon={Italic}
              label="Italic"
              isDisabled={!editor.can().chain().focus().toggleItalic().run()}
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              icon={Strikethrough}
              label="Strikethrough"
              isDisabled={!editor.can().chain().focus().toggleStrike().run()}
            />
            <div className="w-px h-6 bg-border mx-1" />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              icon={Heading1}
              label="Heading 1"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              icon={Heading2}
              label="Heading 2"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              icon={Heading3}
              label="Heading 3"
            />
            <div className="w-px h-6 bg-border mx-1" />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              icon={List}
              label="Bullet List"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              icon={ListOrdered}
              label="Numbered List"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              icon={Quote}
              label="Quote"
            />
            <div className="w-px h-6 bg-border mx-1" />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCode().run()}
              icon={Code}
              label="Inline Code"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              icon={FileCode}
              label="Code Block"
            />
            <div className="w-px h-6 bg-border mx-1" />
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              icon={Undo}
              label="Undo"
              isDisabled={!editor.can().chain().focus().undo().run()}
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              icon={Redo}
              label="Redo"
              isDisabled={!editor.can().chain().focus().redo().run()}
            />
          </>
        )}

        {view === "source" && (
          <span className="text-sm text-muted-foreground px-2">
            Markdown source mode
          </span>
        )}

        <div className="flex-1" />

        <div className="flex gap-0.5 border rounded-md p-0.5 bg-muted/50">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              type="button"
              variant={view === tab.id ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView(tab.id)}
              disabled={disabled}
              className={cn(
                view === tab.id && "bg-background shadow-sm",
                "min-w-[80px]"
              )}
            >
              <tab.icon className="size-4 mr-1" />
              {tab.label}
            </Button>
          ))}
        </div>

        {onSave && isEditing && (
          <Button
            type="button"
            size="sm"
            onClick={onSave}
            disabled={disabled || isSaving}
          >
            <Save className="size-4 mr-1" />
            {isSaving ? "Saving..." : hasChanges ? "Save*" : "Save"}
          </Button>
        )}
      </div>

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

        {view === "source" && (
          <textarea
            ref={textareaRef}
            value={markdownContent}
            onChange={handleMarkdownChange}
            disabled={disabled}
            placeholder={placeholder}
            className="w-full h-full p-4 resize-none focus:outline-none font-mono text-sm bg-transparent"
            autoFocus={autoFocus}
          />
        )}
      </div>
    </div>
  );
}
