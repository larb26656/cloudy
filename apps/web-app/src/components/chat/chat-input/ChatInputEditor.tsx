import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Mention from "@tiptap/extension-mention";
import {
  createMentionSuggestion,
  createCommandSuggestion,
} from "../extensions/suggestion";
import { shouldShowSlashCommand } from "@/lib/command";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChatInputContent, MentionAttrs } from "@/lib/opencode";
import { Placeholder } from "@tiptap/extensions";
import { useQuickPhrasesStore } from "@/stores/quickPhrasesStore";
import { QuickPhrasesBar } from "./QuickPhrasesBar";
import { cn } from "@/lib/utils";

interface ChatInputEditorProps {
  content: ChatInputContent;
  onChange: (content: ChatInputContent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onImmediateExecute?: (commandName: string) => void;
  onAddFiles?: (files: File[]) => void;
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
  onAddFiles,
  placeholder,
  disabled,
  directory,
}: ChatInputEditorProps) {
  const phrases = useQuickPhrasesStore((s) => s.phrases);
  const [isEditorFocused, setIsEditorFocused] = useState(false);

  const onAddFilesRef = useRef(onAddFiles);
  useEffect(() => {
    onAddFilesRef.current = onAddFiles;
  }, [onAddFiles]);

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
        attachments: content.attachments,
      });
    },
    editorProps: {
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        const files: File[] = [];
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (!item) continue;
          if (item.kind !== "file") continue;
          const file = item.getAsFile();
          if (file) files.push(file);
        }

        if (files.length === 0) return false;
        onAddFilesRef.current?.(files);
        return true;
      },
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
      <div
        className={cn("input-chat", !isEditorFocused && "input-chat--single")}
      >
        <EditorContent editor={editor} onKeyDown={onKeyDown} />
      </div>
    </div>
  );
}
