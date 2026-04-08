import { describe, test, expect, mock, beforeEach, afterEach } from "bun:test";
import path from "node:path";
import os from "node:os";

const BASE_PATH = path.join(os.tmpdir(), "cloudy-test", "base-path");
process.env.CLOUDY_ASSISTANT_BASE_PATH = BASE_PATH;

import { extractIdeaPath, isDestructiveBashOnIdea, isFileIdeaFile, isIdeaIndexMd } from "../../src/plugins/idea-plugins";
import { IdeaPlugin } from "../../src/plugins/index";
import type { PluginInput } from "@opencode-ai/plugin";


const IDEA_DIR = "/workspace/base-path/idea";

describe("isDestructiveBashOnIdea", () => {
    describe("should block destructive commands targeting idea dir", () => {
        test("should_return_true_when_rm_targets_idea_file", () => {
            expect(isDestructiveBashOnIdea(`rm ${IDEA_DIR}/my-idea/index.md`, IDEA_DIR)).toBe(true);
        });

        test("should_return_true_when_rm_targets_idea_directory", () => {
            expect(isDestructiveBashOnIdea(`rm -rf ${IDEA_DIR}`, IDEA_DIR)).toBe(true);
        });

        test("should_return_true_when_mv_targets_idea_file", () => {
            expect(isDestructiveBashOnIdea(`mv ${IDEA_DIR}/my-idea/notes.md /tmp`, IDEA_DIR)).toBe(true);
        });

        test("should_return_true_when_cp_overwrites_idea_file", () => {
            expect(isDestructiveBashOnIdea(`cp /tmp/notes.md ${IDEA_DIR}/my-idea/notes.md`, IDEA_DIR)).toBe(true);
        });

        test("should_return_true_when_rmdir_targets_idea", () => {
            expect(isDestructiveBashOnIdea(`rmdir ${IDEA_DIR}/old-idea`, IDEA_DIR)).toBe(true);
        });

        test("should_return_true_when_chmod_targets_idea", () => {
            expect(isDestructiveBashOnIdea(`chmod 755 ${IDEA_DIR}/my-idea`, IDEA_DIR)).toBe(true);
        });

        test("should_return_true_when_chown_targets_idea", () => {
            expect(isDestructiveBashOnIdea(`chown user ${IDEA_DIR}/my-idea`, IDEA_DIR)).toBe(true);
        });

        test("should_return_true_when_ln_targets_idea", () => {
            expect(isDestructiveBashOnIdea(`ln -s /tmp ${IDEA_DIR}/link`, IDEA_DIR)).toBe(true);
        });

        test("should_return_true_when_relative_path_inside_idea", () => {
            const origCwd = process.cwd();
            const tmpDir = path.join(origCwd, "test-fixture-base");
            const ideaRelDir = path.join(tmpDir, "idea");
            try {
                require("node:fs").mkdirSync(ideaRelDir, { recursive: true });
                process.chdir(tmpDir);
                expect(isDestructiveBashOnIdea("rm idea/my-idea/index.md", "idea")).toBe(true);
            } finally {
                process.chdir(origCwd);
                require("node:fs").rmSync(tmpDir, { recursive: true, force: true });
            }
        });
    });

    describe("should allow non-destructive commands", () => {
        test("should_return_false_when_ls_on_idea", () => {
            expect(isDestructiveBashOnIdea(`ls ${IDEA_DIR}`, IDEA_DIR)).toBe(false);
        });

        test("should_return_false_when_cat_on_idea", () => {
            expect(isDestructiveBashOnIdea(`cat ${IDEA_DIR}/my-idea/index.md`, IDEA_DIR)).toBe(false);
        });

        test("should_return_false_when_grep_on_idea", () => {
            expect(isDestructiveBashOnIdea(`grep "pattern" ${IDEA_DIR}/my-idea/index.md`, IDEA_DIR)).toBe(false);
        });

        test("should_return_false_when_find_on_idea", () => {
            expect(isDestructiveBashOnIdea(`find ${IDEA_DIR} -name "*.md"`, IDEA_DIR)).toBe(false);
        });
    });

    describe("should allow destructive commands outside idea dir", () => {
        test("should_return_false_when_rm_targets_outside_idea", () => {
            expect(isDestructiveBashOnIdea("rm /tmp/some-file.txt", IDEA_DIR)).toBe(false);
        });

        test("should_return_false_when_mv_outside_idea", () => {
            expect(isDestructiveBashOnIdea("mv /tmp/a.txt /tmp/b.txt", IDEA_DIR)).toBe(false);
        });
    });

    describe("edge cases", () => {
        test("should_return_false_for_empty_command", () => {
            expect(isDestructiveBashOnIdea("", IDEA_DIR)).toBe(false);
        });

        test("should_return_false_for_whitespace_only_command", () => {
            expect(isDestructiveBashOnIdea("   ", IDEA_DIR)).toBe(false);
        });

        test("should_return_false_when_rm_no_args", () => {
            expect(isDestructiveBashOnIdea("rm", IDEA_DIR)).toBe(false);
        });

        test("should_return_false_for_path_that_only_prefixes_idea_dir", () => {
            expect(isDestructiveBashOnIdea(`rm ${IDEA_DIR}-backup/file.txt`, IDEA_DIR)).toBe(false);
        });
    });
});

describe("isFileIdeaFile", () => {
    test("should_return_true_for_file_inside_idea", () => {
        expect(isFileIdeaFile(`${IDEA_DIR}/my-idea/index.md`, IDEA_DIR)).toBe(true);
    });

    test("should_return_false_for_file_outside_idea", () => {
        expect(isFileIdeaFile("/tmp/some-file.txt", IDEA_DIR)).toBe(false);
    });

    test("should_return_false_for_idea_dir_itself", () => {
        expect(isFileIdeaFile(IDEA_DIR, IDEA_DIR)).toBe(false);
    });
});

describe("isIdeaIndexMd", () => {
    test("should_return_true_for_index_md_in_idea", () => {
        expect(isIdeaIndexMd(`${IDEA_DIR}/my-idea/index.md`, IDEA_DIR)).toBe(true);
    });

    test("should_return_false_for_non_index_md_in_idea", () => {
        expect(isIdeaIndexMd(`${IDEA_DIR}/my-idea/notes.md`, IDEA_DIR)).toBe(false);
    });

    test("should_return_false_for_index_md_outside_idea", () => {
        expect(isIdeaIndexMd("/tmp/index.md", IDEA_DIR)).toBe(false);
    });
});

describe("extractIdeaPath", () => {
    test("should_return_idea_folder_name", () => {
        expect(extractIdeaPath(`${IDEA_DIR}/my-idea/index.md`, IDEA_DIR)).toBe("my-idea");
    });

    test("should_return_idea_folder_name_for_nested_file", () => {
        expect(extractIdeaPath(`${IDEA_DIR}/my-idea/sub/notes.md`, IDEA_DIR)).toBe("my-idea");
    });
});

const PLUGIN_IDEA_DIR = path.join(BASE_PATH, "idea");

function createMockInput(): PluginInput {
    return {
        client: {} as any,
        project: {} as any,
        directory: "",
        worktree: "",
        serverUrl: new URL("http://localhost:3000"),
        $: {} as any,
    };
}

describe("IdeaPlugin", () => {
    let fetchMock: ReturnType<typeof mock>;

    beforeEach(() => {
        fetchMock = mock(async (url: string) => {
            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        });
        globalThis.fetch = fetchMock as any;
    });

    afterEach(() => {
        fetchMock.mockRestore();
    });

    async function getHook() {
        const hooks = await IdeaPlugin(createMockInput());
        return hooks["tool.execute.before"]!;
    }

    describe("bash tool", () => {
        test("should throw on destructive command targeting idea dir", async () => {
            const hook = await getHook();
            await expect(
                hook(
                    { tool: "bash", sessionID: "s1", callID: "c1" },
                    { args: { command: `rm -rf ${PLUGIN_IDEA_DIR}/my-idea` } },
                ),
            ).rejects.toThrow("Cannot run destructive command on idea directory");
        });

        test("should allow non-destructive command on idea dir", async () => {
            const hook = await getHook();
            await expect(
                hook(
                    { tool: "bash", sessionID: "s1", callID: "c1" },
                    { args: { command: `ls ${PLUGIN_IDEA_DIR}` } },
                ),
            ).resolves.toBeUndefined();
        });

        test("should allow destructive command outside idea dir", async () => {
            const hook = await getHook();
            await expect(
                hook(
                    { tool: "bash", sessionID: "s1", callID: "c1" },
                    { args: { command: "rm /tmp/some-file.txt" } },
                ),
            ).resolves.toBeUndefined();
        });
    });

    describe("write tool", () => {

        test("should call touchIdea when writing idea file", async () => {
            const hook = await getHook();
            await hook(
                { tool: "write", sessionID: "s1", callID: "c1" },
                { args: { filePath: `${PLUGIN_IDEA_DIR}/my-idea/notes.md` } },
            );
            expect(fetchMock).toHaveBeenCalledTimes(1);
            const calledUrl = fetchMock.mock.calls[0][0] as string;
            expect(calledUrl).toContain("/api/idea/my-idea/touch");
        });

        test("should not call touchIdea for non-idea file", async () => {
            const hook = await getHook();
            await hook(
                { tool: "write", sessionID: "s1", callID: "c1" },
                { args: { filePath: "/tmp/notes.md" } },
            );
            expect(fetchMock).not.toHaveBeenCalled();
        });
    });

    describe("edit tool", () => {

        test("should call touchIdea when editing idea file", async () => {
            const hook = await getHook();
            await hook(
                { tool: "edit", sessionID: "s1", callID: "c1" },
                { args: { filePath: `${PLUGIN_IDEA_DIR}/my-idea/notes.md` } },
            );
            expect(fetchMock).toHaveBeenCalledTimes(1);
            const calledUrl = fetchMock.mock.calls[0][0] as string;
            expect(calledUrl).toContain("/api/idea/my-idea/touch");
        });

        test("should not call touchIdea for non-idea file", async () => {
            const hook = await getHook();
            await hook(
                { tool: "edit", sessionID: "s1", callID: "c1" },
                { args: { filePath: "/tmp/notes.md" } },
            );
            expect(fetchMock).not.toHaveBeenCalled();
        });
    });

    describe("other tools", () => {
        test("should do nothing for non-bash/write/edit tools", async () => {
            const hook = await getHook();
            await expect(
                hook(
                    { tool: "read", sessionID: "s1", callID: "c1" },
                    { args: { filePath: `${PLUGIN_IDEA_DIR}/my-idea/index.md` } },
                ),
            ).resolves.toBeUndefined();
            expect(fetchMock).not.toHaveBeenCalled();
        });
    });

    describe("touchIdea error handling", () => {
        test("should throw when touchIdea API returns non-ok status", async () => {
            globalThis.fetch = mock(async () => new Response("not found", { status: 404 })) as any;

            const hook = await getHook();
            await expect(
                hook(
                    { tool: "write", sessionID: "s1", callID: "c1" },
                    { args: { filePath: `${PLUGIN_IDEA_DIR}/my-idea/notes.md` } },
                ),
            ).rejects.toThrow("API error 404: not found");
        });
    });
});
