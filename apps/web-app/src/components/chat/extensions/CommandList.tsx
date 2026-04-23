import { useImperativeHandle, forwardRef, useCallback } from "react";
import { Zap } from "lucide-react";

import { useCmdSuggestionHook } from "./useCmdSuggestionHook";
import { CommandListPanel } from "./CommandListPanel";

type CommandSource = "command" | "mcp" | "skill" | "system";

type CommandItemData = {
  id: string;
  label: string;
  name: string;
  description?: string;
  source?: CommandSource;
  hints: Array<string>;
  immediate?: boolean;
};

type CommandListProps = {
  items: CommandItemData[];
  command: (item: CommandItemData) => void;
  onImmediateExecute?: (item: CommandItemData) => void;
};

export type CommandListRef = {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
};

const CommandListComponent = forwardRef<CommandListRef, CommandListProps>(
  (props, ref) => {
    const itemToValue = (item: CommandItemData) => `${item.name}`;

    const selectItem = useCallback(
      (item: CommandItemData) => {
        if (item.immediate && props.onImmediateExecute) {
          props.onImmediateExecute(item);
        } else {
          props.command(item);
        }
      },
      [props],
    );

    const { setCmdRoot, selectedValue, setSelectedValue, onKeyDown } =
      useCmdSuggestionHook<CommandItemData>({
        items: props.items,
        selectItem,
        itemToValue,
      });

    useImperativeHandle(ref, () => ({
      onKeyDown,
    }));

    const getSourceBadge = (source?: CommandSource) => {
      if (!source) return null;
      const colors: Record<CommandSource, string> = {
        command: "bg-blue-500/10 text-blue-500",
        mcp: "bg-purple-500/10 text-purple-500",
        skill: "bg-green-500/10 text-green-500",
        system: "bg-orange-500/10 text-orange-500",
      };
      return (
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${colors[source]}`}>
          {source}
        </span>
      );
    };

    return (
      <CommandListPanel
        items={props.items}
        itemToValue={itemToValue}
        selectItem={selectItem}
        setSelectedValue={setSelectedValue}
        renderItem={(item: CommandItemData) => (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="font-medium">{item.name}</span>
              {getSourceBadge(item.source)}
              {item.immediate && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 flex items-center gap-1">
                  <Zap className="size-3" />
                  immediate
                </span>
              )}
            </div>
            {item.description && (
              <span className="text-xs text-muted-foreground line-clamp-1">
                {item.description}
              </span>
            )}
          </div>
        )}
        renderEmpty={() => "No result"}
        selectedValue={selectedValue}
        cmdRootRef={setCmdRoot}
      />
    );
  },
);

CommandListComponent.displayName = "CommandList";

export default CommandListComponent;
