import { joinUrl, resolveUrl } from "./url";

describe("resolveUrl", () => {
  it("removes trailing slashes from absolute URLs", () => {
    expect(resolveUrl("http://127.0.0.1:4122/")).toBe("http://127.0.0.1:4122");
  });

  it("joins origin and paths with one slash", () => {
    vi.stubGlobal("window", { origin: "http://127.0.0.1:4122" });

    expect(resolveUrl("//api/providers/opencode")).toBe(
      "http://127.0.0.1:4122/api/providers/opencode",
    );
  });

  it("joins an API base URL and path with one slash", () => {
    expect(
      joinUrl("http://127.0.0.1:4122/", "/api/providers/opencode/events"),
    ).toBe("http://127.0.0.1:4122/api/providers/opencode/events");
  });

  it("joins multiple path segments", () => {
    expect(
      joinUrl("http://127.0.0.1:4122/", "/api/", "/providers/", "opencode"),
    ).toBe("http://127.0.0.1:4122/api/providers/opencode");
  });
});
