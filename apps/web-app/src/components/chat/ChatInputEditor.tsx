import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyleKit } from "@tiptap/extension-text-style";
import Mention from "@tiptap/extension-mention";
import { createMentionSuggestion } from "./extensions/suggestion";
import { useEffect, useMemo } from "react";
import { useDirectoryStore } from "@/stores";
import type { ChatInputContent, MentionAttrs } from "@/lib/opencode";
import { Placeholder } from "@tiptap/extensions";

interface ChatInputEditorProps {
  content: ChatInputContent;
  onChange: (content: ChatInputContent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  disabled?: boolean;
}

function getMentions(editor: Editor) {
  const mentions: MentionAttrs[] = [];

  editor.state.doc.descendants((node) => {
    if (node.type.name === "mention") {
      mentions.push(node.attrs as MentionAttrs);
    }
  });

  return mentions;
}

export function ChatInputEditor({
  content,
  onChange,
  onKeyDown,
  placeholder,
  disabled,
}: ChatInputEditorProps) {
  const { selectedDirectory } = useDirectoryStore();

  const extensions = useMemo(() => {
    return [
      TextStyleKit,
      StarterKit,
      Mention.configure({
        HTMLAttributes: {
          class: "mention",
        },
        suggestion: selectedDirectory
          ? createMentionSuggestion(selectedDirectory)
          : {},
      }),
      Placeholder.configure({
        placeholder: placeholder,
      }),
    ];
  }, [selectedDirectory, placeholder]);

  const editor = useEditor({
    extensions,
    content: content.text,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange({
        text: editor.getText(),
        mentions: getMentions(editor),
      });
    },
  });

  useEffect(() => {
    if (!editor) return;

    if (content.text === "") {
      editor.commands.setContent("");
    }
  }, [content.text, editor]);

  return (
    <div className="input-chat">
      <EditorContent editor={editor} onKeyDown={onKeyDown} />
    </div>
  );
}
