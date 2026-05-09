import { useMemo, useRef, useState } from "react";

export function useTextHistory() {
    const histories = useRef<string[]>([]);
    // เปลี่ยนจาก useRef เป็น useState เพื่อให้เกิดการ Re-render เมื่อ Index เปลี่ยน
    const [cursorIndex, setCursorIndex] = useState<number>(-1);

    const currentValue = useMemo(() => {
        if (cursorIndex === -1) return "";
        return histories.current[cursorIndex] ?? "";
    }, [cursorIndex])

    const resetCursor = () => setCursorIndex(-1);

    const clear = () => {
        histories.current = [];
        resetCursor();
    };

    const push = (text: string) => {
        if (!text.trim()) return;
        histories.current.push(text);
        resetCursor();
    };

    const scrollUp = () => {
        if (histories.current.length === 0) return;

        setCursorIndex((prev) => {
            if (prev === -1) return histories.current.length - 1;
            if (prev === 0) return 0;
            return prev - 1;
        });
    };

    const scrollDown = () => {
        setCursorIndex((prev) => {
            if (prev === -1 || prev === histories.current.length - 1) return -1;
            return prev + 1;
        });
    };

    return {
        histories,
        cursorIndex,
        scrollUp,
        scrollDown,
        push,
        clear,
        currentValue,
        resetCursor
    };
}