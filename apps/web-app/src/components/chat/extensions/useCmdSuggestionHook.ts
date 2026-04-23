import { useCallback, useEffect, useState } from "react";

type UseCmdSuggestionHookOptionProps<T> = {
    items: T[]
    selectItem: (selectedItem: T) => void
    itemToValue: (item: T) => string
}
export function useCmdSuggestionHook<T>({ items, selectItem, itemToValue }: UseCmdSuggestionHookOptionProps<T>) {
    const [cmdRoot, setCmdRoot] = useState<HTMLDivElement | null>(null);
    const [selectedValue, setSelectedValue] = useState("");

    useEffect(() => {
        if (items.length > 0 && !selectedValue) {
            setSelectedValue(itemToValue(items[0]));
        } else if (items.length === 0) {
            setSelectedValue("");
        }
    }, [items, selectedValue, setSelectedValue, itemToValue]);

    const getItemByValue = useCallback(
        (value: string): T | undefined => {
            return items.find((item) => itemToValue(item) === value);
        },
        [items],
    );

    const enterHandler = () => {
        const selectedItem = getItemByValue(selectedValue);

        if (!selectedItem) {
            return;
        }

        selectItem(selectedItem);
    };

    const moveCursorHandler = (event: KeyboardEvent) => {
        if (cmdRoot) {
            event.preventDefault();
            const newEvent = new KeyboardEvent("keydown", {
                key: event.key,
                bubbles: true,
                cancelable: true,
            });
            cmdRoot.dispatchEvent(newEvent);
            return true;
        }
    };

    const onKeyDown = ({ event }: { event: KeyboardEvent }) => {
        if (items.length === 0) return false;

        if (event.key === "Tab" || event.key === "Enter") {
            event.stopPropagation();
            enterHandler();
            return true;
        }

        if (event.key === "ArrowUp" || event.key === "ArrowDown") {
            moveCursorHandler(event);
            return true;
        }

        return false;
    }

    return {
        cmdRoot,
        setCmdRoot,
        selectedValue,
        setSelectedValue,
        getItemByValue,
        onKeyDown
    }
}