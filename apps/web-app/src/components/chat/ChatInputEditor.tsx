import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Mention from "@tiptap/extension-mention";
import {
  createMentionSuggestion,
  createCommandSuggestion,
} from "./extensions/suggestion";
import { shouldShowSlashCommand } from "@/lib/command";
import { useEffect, useMemo } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import type { ChatInputContent, MentionAttrs } from "@/lib/opencode";
import { Placeholder } from "@tiptap/extensions";
import { useCurrentInstanceId } from "@/hooks/instanceScopeHook";

interface ChatInputEditorProps {
  content: ChatInputContent;
  onChange: (content: ChatInputContent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onImmediateExecute?: (commandName: string) => void;
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
  onImmediateExecute,
  placeholder,
  disabled,
}: ChatInputEditorProps) {
  const selectedDirectory =
    useWorkspaceStore().getCurrentWorkspace()?.directory;
  const instanceId = useCurrentInstanceId();

  const extensions = useMemo(() => {
    return [
      StarterKit.configure({
        bold: false,
        italic: false,
        strike: false,
        code: false,
        codeBlock: false,
      }),
      Mention.configure({
        HTMLAttributes: {
          class: "mention",
        },
        suggestions: [
          {
            char: "@",
            allow: () => !!selectedDirectory,
            ...(selectedDirectory
              ? createMentionSuggestion(selectedDirectory, instanceId)
              : {}),
          },
          {
            char: "/",
            allow: shouldShowSlashCommand,
            ...createCommandSuggestion(instanceId, {
              onImmediateExecute: (cmd) => {
                onImmediateExecute?.(cmd.name);
              },
            }),
          },
        ],
      }),
      Placeholder.configure({
        placeholder: placeholder,
      }),
    ];
  }, [selectedDirectory, instanceId, placeholder, onImmediateExecute]);

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

    const currentText = editor.getText();
    if (content.text !== currentText) {
      editor.commands.setContent(content.text);
    }
  }, [content.text, editor]);

  return (
    <div className="input-chat">
      <EditorContent editor={editor} onKeyDown={onKeyDown} />
    </div>
  );
}
