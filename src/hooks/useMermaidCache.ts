import { useRef } from "react";

export function useMermaidCache() {
    const cacheRef = useRef<Map<string, string>>(new Map());
    return cacheRef;
}