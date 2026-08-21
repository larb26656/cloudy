import { beforeEach, describe, expect, it } from "vitest";
import { MAX_ENTRIES, useRecentDirectoryStore } from "./recentDirectoryStore";

describe("recentDirectoryStore", () => {
  beforeEach(() => {
    useRecentDirectoryStore.setState({ paths: [] });
  });

  it("pushes a new path to the front", () => {
    const { push } = useRecentDirectoryStore.getState();
    push("/work/cloudy");
    push("/tmp/scratch");

    expect(useRecentDirectoryStore.getState().paths).toEqual([
      "/tmp/scratch",
      "/work/cloudy",
    ]);
  });

  it("dedupes and moves an existing path to the front", () => {
    const { push } = useRecentDirectoryStore.getState();
    push("/work/cloudy");
    push("/tmp/scratch");
    push("/work/cloudy");

    expect(useRecentDirectoryStore.getState().paths).toEqual([
      "/work/cloudy",
      "/tmp/scratch",
    ]);
  });

  it("caps entries at MAX_ENTRIES", () => {
    const { push } = useRecentDirectoryStore.getState();
    for (let i = 0; i < MAX_ENTRIES + 3; i++) {
      push(`/dir-${i}`);
    }

    const paths = useRecentDirectoryStore.getState().paths;
    expect(paths).toHaveLength(MAX_ENTRIES);
    expect(paths[0]).toBe(`/dir-${MAX_ENTRIES + 2}`);
  });

  it("ignores empty and whitespace-only paths", () => {
    const { push } = useRecentDirectoryStore.getState();
    push("");
    push("   ");

    expect(useRecentDirectoryStore.getState().paths).toEqual([]);
  });

  it("removes a single path", () => {
    useRecentDirectoryStore.setState({
      paths: ["/work/cloudy", "/tmp/scratch"],
    });
    const { remove } = useRecentDirectoryStore.getState();
    remove("/work/cloudy");

    expect(useRecentDirectoryStore.getState().paths).toEqual(["/tmp/scratch"]);
  });
});
