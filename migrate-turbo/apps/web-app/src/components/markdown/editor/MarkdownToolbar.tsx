import { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
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
  FileCode,
  Save,
  Undo,
  Redo,
  Table,
} from "lucide-react";

interface ToolbarButtonProps {
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isDisabled?: boolean;
}

function ToolbarButton({
  onClick,
  icon: Icon,
  label,
  isDisabled,
}: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={onClick}
      disabled={isDisabled}
      title={label}
    >
      <Icon className="size-4" />
    </Button>
  );
}

interface MarkdownToolbarProps {
  editor: Editor | null;
  disabled?: boolean;
  isSaving?: boolean;
  hasChanges?: boolean;
  onSave?: (content: string) => void;
}

export function MarkdownToolbar({
  editor,
  disabled,
  isSaving,
  hasChanges,
  onSave,
}: MarkdownToolbarProps) {
  const handleOnSave = () => {
    if (!onSave || !editor) return;
    const markdown = editor.getMarkdown();
    onSave(markdown);
  };

  return (
    <div className="flex items-center gap-1 border-b p-2 flex-wrap">
      {editor && (
        <>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            icon={Bold}
            label="Bold"
            isDisabled={
              disabled || !editor.can().chain().focus().toggleBold().run()
            }
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            icon={Italic}
            label="Italic"
            isDisabled={
              disabled || !editor.can().chain().focus().toggleItalic().run()
            }
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            icon={Strikethrough}
            label="Strikethrough"
            isDisabled={
              disabled || !editor.can().chain().focus().toggleStrike().run()
            }
          />
          <div className="w-px h-6 bg-border mx-1" />
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            icon={Heading1}
            label="Heading 1"
          />
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            icon={Heading2}
            label="Heading 2"
          />
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
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
            onClick={() =>
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            }
            icon={Table}
            label="Insert Table"
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
            isDisabled={disabled || !editor.can().chain().focus().undo().run()}
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            icon={Redo}
            label="Redo"
            isDisabled={disabled || !editor.can().chain().focus().redo().run()}
          />
        </>
      )}

      <div className="flex-1" />

      {onSave && (
        <Button
          type="button"
          size="sm"
          onClick={handleOnSave}
          disabled={disabled || isSaving}
        >
          <Save className="size-4 mr-1" />
          {isSaving ? "Saving..." : hasChanges ? "Save*" : "Save"}
        </Button>
      )}
    </div>
  );
}
