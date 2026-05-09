import { useRef } from "react";

export function useTextHistory() {
    const histories = useRef<string[]>([]);
    const cursorIndex = useRef<number>(-1);

    const resetCursor = () => {
        cursorIndex.current = -1;
    }

    const push = (text: string) => {
        histories.current.push(text);
        resetCursor();
    }

    const clear = () => {
        histories.current = [];
        resetCursor();
    }

    const scrollUp = () => {
        if (histories.current.length === 0) {
            resetCursor();
            return;
        }

        if (cursorIndex.current == -1) {
            cursorIndex.current = histories.current.length - 1;
            return;
        }

        if (cursorIndex.current == 0) {
            // skip when cursor on first index
            return;
        }

        cursorIndex.current--;
    }

    const scrollDown = () => {
        if (histories.current.length === 0) {
            resetCursor();
            return;
        }

        if (cursorIndex.current == -1) {
            // reset when empty index
            resetCursor();
            return;
        }

        if (cursorIndex.current == histories.current.length - 1) {
            // skip when cursor on last index
            return;
        }

        cursorIndex.current++;
    }

    return {
        cursorIndex,
        histories,
        scrollUp,
        scrollDown,
        push,
        clear
    }

}