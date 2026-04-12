import { describe, it, expect } from "vitest";
import type { Message } from "@/types";
import type { Part } from "@opencode-ai/sdk/v2";
import { extractFromParts, extractFromMessage, extractFromMessages } from "./file-summarize";

describe("file-summarize", () => {
    describe("extractFromParts", () => {
        it("returns empty array for empty parts", () => {
            const parts: Part[] = [];
            expect(extractFromParts(parts)).toEqual([]);
        });

        it("returns empty array when parts have no write or edit tools", () => {
            const parts: Part[] = [
                {
                    type: "tool",
                    tool: "read",
                    state: {
                        input: { filePath: "test.txt", content: "hello" },
                    },
                } as unknown as Part,
            ];
            expect(extractFromParts(parts)).toEqual([]);
        });

        it("extracts single write", () => {
            const parts: Part[] = [
                {
                    type: "tool",
                    tool: "write",
                    state: {
                        input: { filePath: "src/index.ts", content: "console.log('hello')" },
                    },
                } as unknown as Part,
            ];
            const result = extractFromParts(parts);
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                name: "src/index.ts",
                path: "src/index.ts",
                type: "write",
                content: "console.log('hello')",
            });
        });

        it("extracts single edit", () => {
            const parts: Part[] = [
                {
                    type: "tool",
                    tool: "edit",
                    state: {
                        input: { filePath: "src/app.ts", oldString: "const a = 1", newString: "const b = 2" },
                    },
                } as unknown as Part,
            ];
            const result = extractFromParts(parts);
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                name: "src/app.ts",
                path: "src/app.ts",
                type: "edit",
                content: "const b = 2",
                originalContent: "const a = 1",
            });
        });

        it("Case 1: write → edit → edit merges content", () => {
            const parts: Part[] = [
                {
                    type: "tool",
                    tool: "write",
                    state: {
                        input: { filePath: "test.ts", content: "v1" },
                    },
                } as unknown as Part,
                {
                    type: "tool",
                    tool: "edit",
                    state: {
                        input: { filePath: "test.ts", oldString: "v1", newString: "v2" },
                    },
                } as unknown as Part,
                {
                    type: "tool",
                    tool: "edit",
                    state: {
                        input: { filePath: "test.ts", oldString: "v2", newString: "v3" },
                    },
                } as unknown as Part,
            ];
            const result = extractFromParts(parts);
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                name: "test.ts",
                path: "test.ts",
                type: "write",
                content: "v3",
            });
        });

        it("Case 2: edit ท่อนๆ applies sequentially", () => {
            const parts: Part[] = [
                {
                    type: "tool",
                    tool: "write",
                    state: {
                        input: { filePath: "test.ts", content: "line1\nline2" },
                    },
                } as unknown as Part,
                {
                    type: "tool",
                    tool: "edit",
                    state: {
                        input: { filePath: "test.ts", oldString: "line1", newString: "line1_new" },
                    },
                } as unknown as Part,
                {
                    type: "tool",
                    tool: "edit",
                    state: {
                        input: { filePath: "test.ts", oldString: "line2", newString: "line2_new" },
                    },
                } as unknown as Part,
            ];
            const result = extractFromParts(parts);
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                name: "test.ts",
                path: "test.ts",
                type: "write",
                content: "line1_new\nline2_new",
            });
        });

        it("Case 3: write → edit → write takes last write", () => {
            const parts: Part[] = [
                {
                    type: "tool",
                    tool: "write",
                    state: {
                        input: { filePath: "test.ts", content: "v1" },
                    },
                } as unknown as Part,
                {
                    type: "tool",
                    tool: "edit",
                    state: {
                        input: { filePath: "test.ts", oldString: "v1", newString: "v2" },
                    },
                } as unknown as Part,
                {
                    type: "tool",
                    tool: "write",
                    state: {
                        input: { filePath: "test.ts", content: "v3" },
                    },
                } as unknown as Part,
            ];
            const result = extractFromParts(parts);
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                name: "test.ts",
                path: "test.ts",
                type: "write",
                content: "v3",
            });
        });

        it("Case 4: write → write takes last write", () => {
            const parts: Part[] = [
                {
                    type: "tool",
                    tool: "write",
                    state: {
                        input: { filePath: "test.ts", content: "v1" },
                    },
                } as unknown as Part,
                {
                    type: "tool",
                    tool: "write",
                    state: {
                        input: { filePath: "test.ts", content: "v2" },
                    },
                } as unknown as Part,
            ];
            const result = extractFromParts(parts);
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                name: "test.ts",
                path: "test.ts",
                type: "write",
                content: "v2",
            });
        });

        it("handles multiple files separately", () => {
            const parts: Part[] = [
                {
                    type: "tool",
                    tool: "write",
                    state: {
                        input: { filePath: "a.ts", content: "file a" },
                    },
                } as unknown as Part,
                {
                    type: "tool",
                    tool: "edit",
                    state: {
                        input: { filePath: "b.ts", oldString: "x", newString: "y" },
                    },
                } as unknown as Part,
            ];
            const result = extractFromParts(parts);
            expect(result).toHaveLength(2);
            expect(result.find((f) => f.path === "a.ts")?.content).toBe("file a");
            expect(result.find((f) => f.path === "a.ts")?.type).toBe("write");
            expect(result.find((f) => f.path === "b.ts")?.content).toBe("y");
            expect(result.find((f) => f.path === "b.ts")?.type).toBe("edit");
            expect(result.find((f) => f.path === "b.ts")?.originalContent).toBe("x");
        });

        it("pure edit stack returns type edit with originalContent", () => {
            const parts: Part[] = [
                {
                    type: "tool",
                    tool: "edit",
                    state: {
                        input: { filePath: "test.ts", oldString: "a", newString: "b" },
                    },
                } as unknown as Part,
                {
                    type: "tool",
                    tool: "edit",
                    state: {
                        input: { filePath: "test.ts", oldString: "b", newString: "c" },
                    },
                } as unknown as Part,
            ];
            const result = extractFromParts(parts);
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                name: "test.ts",
                path: "test.ts",
                type: "edit",
                content: "c",
                originalContent: "a",
            });
        });
    });

    describe("extractFromMessage", () => {
        it("extracts file items from message parts", () => {
            const message: Message = {
                info: { role: "assistant", id: "1" } as Message["info"],
                parts: [
                    {
                        type: "tool",
                        tool: "write",
                        state: {
                            input: { filePath: "test.ts", content: "code" },
                        },
                    } as unknown as Part,
                ],
            };
            const result = extractFromMessage(message);
            expect(result).toHaveLength(1);
            expect(result[0].path).toBe("test.ts");
        });
    });

    describe("extractFromMessages", () => {
        it("extracts file items from multiple messages", () => {
            const messages: Message[] = [
                {
                    info: { role: "assistant", id: "1" } as Message["info"],
                    parts: [
                        {
                            type: "tool",
                            tool: "write",
                            state: {
                                input: { filePath: "a.ts", content: "file a" },
                            },
                        } as unknown as Part,
                    ],
                },
                {
                    info: { role: "assistant", id: "2" } as Message["info"],
                    parts: [
                        {
                            type: "tool",
                            tool: "edit",
                            state: {
                                input: { filePath: "b.ts", oldString: "x", newString: "y" },
                            },
                        } as unknown as Part,
                    ],
                },
            ];
            const result = extractFromMessages(messages);
            expect(result).toHaveLength(2);
            expect(result[0].path).toBe("a.ts");
            expect(result[1].path).toBe("b.ts");
        });

        it("returns empty array for empty messages", () => {
            const messages: Message[] = [];
            expect(extractFromMessages(messages)).toEqual([]);
        });
    });
});
