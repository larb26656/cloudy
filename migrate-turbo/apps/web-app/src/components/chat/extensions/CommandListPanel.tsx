import {
  Command,
  CommandItem,
  CommandList,
  CommandEmpty,
} from "@/components/ui/command";
import { useEffect, useRef, type Ref } from "react";

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
  const prevItemsRef = useRef(items);

  useEffect(() => {
    // Detect items reference changed
    if (items !== prevItemsRef.current) {
      prevItemsRef.current = items;

      if (items.length > 0) {
        setSelectedValue(itemToValue(items[0]));
      } else {
        setSelectedValue("");
      }
    }
  }, [items, selectedValue, setSelectedValue, itemToValue]);

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
