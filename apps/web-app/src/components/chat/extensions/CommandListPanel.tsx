import {
  Command,
  CommandItem,
  CommandList,
  CommandEmpty,
} from "@/components/ui/command";
import type { Ref } from "react";

type CommandListPanelProps<T> = {
  items: T[];
  itemToValue: (item: T) => string;
  selectItem: (item: T) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
  selectedValue: string;
  setSelectedValue: (value: string) => void;
  cmdRootRef: Ref<HTMLDivElement | null>;
};

function CommandListPanel<T>({
  items,
  itemToValue,
  selectItem,
  renderItem,
  renderEmpty,
  selectedValue,
  setSelectedValue,
  cmdRootRef,
}: CommandListPanelProps<T>) {
  return (
    <div className="z-50 w-80 rounded-md border bg-popover shadow-md">
      <Command
        shouldFilter={false}
        loop
        value={selectedValue}
        onValueChange={setSelectedValue}
        ref={cmdRootRef}
      >
        <CommandList>
          {items.length === 0 ? (
            renderEmpty ? (
              renderEmpty()
            ) : (
              <CommandEmpty>No commands found</CommandEmpty>
            )
          ) : (
            items.map((item, index) => (
              <CommandItem
                key={itemToValue(item)}
                value={itemToValue(item)}
                onSelect={() => selectItem(item)}
              >
                {renderItem(item, index)}
              </CommandItem>
            ))
          )}
        </CommandList>
      </Command>
    </div>
  );
}

export { CommandListPanel };
export type { CommandListPanelProps };
