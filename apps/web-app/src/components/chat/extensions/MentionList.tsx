import { useEffect, useImperativeHandle, useState, forwardRef } from "react";

import {
  Command,
  CommandItem,
  CommandList,
  CommandEmpty,
} from "@/components/ui/command";

type MentionListProps = {
  items: string[];
  command: (item: { id: string }) => void;
};

export type MentionListRef = {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
};

const MentionList = forwardRef<MentionListRef, MentionListProps>(
  (props, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
      const item = props.items[index];
      if (item) {
        props.command({ id: item });
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

    return (
      <div className="z-50 w-64 rounded-md border bg-popover shadow-md">
        <Command>
          <CommandList>
            {props.items.length === 0 && <CommandEmpty>No result</CommandEmpty>}

            {props.items.map((item, index) => (
              <CommandItem
                key={index}
                onSelect={() => selectItem(index)}
                className={index === selectedIndex ? "bg-accent" : ""}
              >
                {item}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </div>
    );
  },
);

MentionList.displayName = "MentionList";

export default MentionList;
