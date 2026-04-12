import { useEffect, useImperativeHandle, useState, forwardRef } from "react";

import {
  Command,
  CommandItem,
  CommandList,
  CommandEmpty,
} from "@/components/ui/command";

type CommandSource = "command" | "mcp" | "skill";

type CommandItem = {
  id: string;
  label: string;
  name: string;
  description?: string;
  source?: CommandSource;
  hints: Array<string>;
};

type CommandListProps = {
  items: CommandItem[];
  command: (item: CommandItem) => void;
};

export type CommandListRef = {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
};

const CommandListComponent = forwardRef<CommandListRef, CommandListProps>(
  (props, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
      const item = props.items[index];
      if (item) {
        props.command(item);
      }
    };

    const upHandler = () => {
      setSelectedIndex(
        (prev) => (prev + props.items.length - 1) % props.items.length,
      );
    };

    const downHandler = () => {
      setSelectedIndex((prev) => (prev + 1) % props.items.length);
    };

    const enterHandler = () => {
      selectItem(selectedIndex);
    };

    useEffect(() => {
      setSelectedIndex(0);
    }, [props.items]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === "ArrowUp") {
          upHandler();
          return true;
        }

        if (event.key === "ArrowDown") {
          downHandler();
          return true;
        }

        if (event.key === "Tab" || event.key === "Enter") {
          event.stopPropagation();
          enterHandler();
          return true;
        }

        return false;
      },
    }));

    const getSourceBadge = (source?: CommandSource) => {
      if (!source) return null;
      const colors: Record<CommandSource, string> = {
        command: "bg-blue-500/10 text-blue-500",
        mcp: "bg-purple-500/10 text-purple-500",
        skill: "bg-green-500/10 text-green-500",
      };
      return (
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${colors[source]}`}>
          {source}
        </span>
      );
    };

    return (
      <div className="z-50 w-80 rounded-md border bg-popover shadow-md">
        <Command>
          <CommandList>
            {props.items.length === 0 && <CommandEmpty>No commands found</CommandEmpty>}

            {props.items.map((item, index) => (
              <CommandItem
                key={item.id}
                onSelect={() => selectItem(index)}
                className={index === selectedIndex ? "bg-accent" : ""}
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.name}</span>
                    {getSourceBadge(item.source)}
                  </div>
                  {item.description && (
                    <span className="text-xs text-muted-foreground line-clamp-1">
                      {item.description}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </div>
    );
  },
);

CommandListComponent.displayName = "CommandList";

export default CommandListComponent;
