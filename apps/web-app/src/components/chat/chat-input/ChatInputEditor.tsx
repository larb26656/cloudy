import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Mention from "@tiptap/extension-mention";
import {
  createMentionSuggestion,
  createCommandSuggestion,
} from "../extensions/suggestion";
import { shouldShowSlashCommand } from "@/lib/command";
import { useEffect, useMemo, useState } from "react";
import type { ChatInputContent, MentionAttrs } from "@/lib/opencode";
import { Placeholder } from "@tiptap/extensions";
import { useQuickPhrasesStore } from "@/stores/quickPhrasesStore";
import { QuickPhrasesBar } from "./QuickPhrasesBar";

interface ChatInputEditorProps {
  content: ChatInputContent;
  onChange: (content: ChatInputContent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onImmediateExecute?: (commandName: string) => void;
  placeholder?: string;
  disabled?: boolean;
  directory: string;
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
  onImmediateExecute,
  placeholder,
  disabled,
  directory,
}: ChatInputEditorProps) {
  const phrases = useQuickPhrasesStore((s) => s.phrases);
  const [isEditorFocused, setIsEditorFocused] = useState(false);

  const extensions = useMemo(() => {
    return [
      StarterKit.configure({
        bold: false,
        italic: false,
        strike: false,
        code: false,
        codeBlock: false,
        orderedList: false,
        heading: false,
      }),
      Mention.configure({
        HTMLAttributes: { class: "mention" },
        suggestions: [
          {
            char: "@",
            allow: () => true,
            ...createMentionSuggestion(directory),
          },
          {
            char: "/",
            allow: shouldShowSlashCommand,
            ...createCommandSuggestion(directory, {
              onImmediateExecute: (cmd) => {
                onImmediateExecute?.(cmd.name);
              },
            }),
          },
        ],
      }),
      Placeholder.configure({ placeholder: placeholder }),
    ];
  }, [directory, placeholder, onImmediateExecute]);

  const editor = useEditor({
    extensions,
    content: content.text,
    editable: !disabled,
    onFocus: () => setIsEditorFocused(true),
    onBlur: () => setIsEditorFocused(false),
    onUpdate: ({ editor }) => {
      onChange({
        text: editor.getText({ blockSeparator: "\n" }),
        mentions: getMentions(editor),
      });
    },
  });

  useEffect(() => {
    if (!editor) return;
    const currentText = editor.getText({ blockSeparator: "\n" });
    if (content.text !== currentText) {
      editor.commands.setContent(content.text);
    }
  }, [content.text, editor]);

  const handlePhraseSelect = (phrase: string) => {
    if (!editor) return;
    const text = editor.getText({ blockSeparator: "\n" });
    const separator = text && !text.endsWith(" ") ? " " : "";
    const endPos = editor.state.doc.content.size;
    editor
      .chain()
      .focus()
      .setTextSelection(endPos)
      .insertContent(separator + phrase)
      .run();
  };

  return (
    <div className="flex w-full flex-col">
      {isEditorFocused && phrases.length > 0 && (
        <QuickPhrasesBar phrases={phrases} onSelect={handlePhraseSelect} />
      )}
      <div className="input-chat">
        <EditorContent editor={editor} onKeyDown={onKeyDown} />
      </div>
    </div>
  );
}
