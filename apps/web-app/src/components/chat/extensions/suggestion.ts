import { computePosition, flip, shift } from "@floating-ui/dom";
import { posToDOMRect, ReactRenderer } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import type { MentionListRef } from "./MentionList";
import MentionCommandList, { type CommandListRef } from "./CommandList";
import MentionList from "./MentionList";
import type {
  SuggestionKeyDownProps,
  SuggestionProps,
} from "@tiptap/suggestion";
import type { MentionNodeAttrs } from "@tiptap/extension-mention";
import { systemCommands } from "@/lib/commands";
import { type Command, type CommandSource } from "@/lib/command";
import { getOcClient } from "@/lib/opencode";

type MentionItem = string;

type CommandItem = Command & { id: string; label: string };

type MentionSuggestionProps = SuggestionProps<MentionItem, MentionNodeAttrs>;
type CommandSuggestionProps = SuggestionProps<CommandItem, MentionNodeAttrs>;

const updatePosition = (editor: Editor, element: HTMLElement) => {
  const virtualElement = {
    getBoundingClientRect: () =>
      posToDOMRect(
        editor.view,
        editor.state.selection.from,
        editor.state.selection.to,
      ),
  };

  computePosition(virtualElement, element, {
    placement: "bottom-start",
    strategy: "absolute",
    middleware: [shift(), flip()],
  }).then(({ x, y, strategy }) => {
    element.style.width = "max-content";
    element.style.position = strategy;
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
  });
};

export function createMentionSuggestion(directory: string) {
  return {
    items: async ({ query }: { query: string }): Promise<string[]> => {
      const oc = getOcClient();
      const result = await oc.find.files({
        directory,
        query,
        limit: 20,
      });
      return result.data ?? [];
    },

    render: () => {
      let component: ReactRenderer<MentionListRef> | null = null;

      return {
        onStart: (props: MentionSuggestionProps) => {
          component = new ReactRenderer(MentionList, {
            props,
            editor: props.editor,
          });
          if (!props.clientRect) return;
          component.element.style.position = "absolute";
          document.body.appendChild(component.element);
          updatePosition(props.editor, component.element);
        },
        onUpdate: (props: MentionSuggestionProps) => {
          component?.updateProps(props);
          if (!props.clientRect) return;
          updatePosition(props.editor, component!.element);
        },
        onKeyDown: (props: SuggestionKeyDownProps) => {
          if (props.event.key === "Escape") {
            component?.destroy();
            return true;
          }
          return component?.ref?.onKeyDown(props) ?? false;
        },
        onExit: () => {
          if (!component) return;
          component.element.remove();
          component.destroy();
          component = null;
        },
      };
    },
  };
}

type CommandSuggestionOptions = {
  onImmediateExecute?: (item: CommandItem) => void;
};

export function createCommandSuggestion(
  directory: string,
  options?: CommandSuggestionOptions,
) {
  return {
    items: async ({ query }: { query: string }): Promise<CommandItem[]> => {
      const oc = getOcClient();
      const result = await oc.command.list({
        directory,
      });
      const openCodeCommands = result.data ?? [];

      const systemCommandItems: Command[] = systemCommands.map((cmd) => ({
        name: cmd.name,
        description: cmd.description,
        source: "system" as CommandSource,
        template: "",
        hints: [],
        immediate: cmd.immediate,
      }));

      const commands = [...systemCommandItems, ...openCodeCommands];

      return commands
        .filter((cmd) => cmd.name.includes(query))
        .map((cmd) => ({
          ...cmd,
          id: cmd.name,
          label: cmd.name,
        }));
    },

    render: () => {
      let component: ReactRenderer<CommandListRef> | null = null;

      return {
        onStart: (props: CommandSuggestionProps) => {
          component = new ReactRenderer(MentionCommandList, {
            props: {
              ...props,
              onImmediateExecute: options?.onImmediateExecute,
            },
            editor: props.editor,
          });
          if (!props.clientRect) return;
          component.element.style.position = "absolute";
          document.body.appendChild(component.element);
          updatePosition(props.editor, component.element);
        },
        onUpdate: (props: CommandSuggestionProps) => {
          component?.updateProps({
            ...props,
            onImmediateExecute: options?.onImmediateExecute,
          });
          if (!props.clientRect) return;
          updatePosition(props.editor, component!.element);
        },
        onKeyDown: (props: SuggestionKeyDownProps) => {
          if (props.event.key === "Escape") {
            component?.destroy();
            return true;
          }
          return component?.ref?.onKeyDown(props) ?? false;
        },
        onExit: () => {
          if (!component) return;
          component.element.remove();
          component.destroy();
          component = null;
        },
      };
    },
  };
}
