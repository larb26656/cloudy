import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { createTestApp } from "../../test-utils";

type TestEnv = ReturnType<typeof createTestApp>;

describe("proxy integration", () => {
  const originalFetch = globalThis.fetch;
  let env: TestEnv;

  beforeEach(() => {
    vi.stubEnv("SHELL", "/bin/sh");
    env = createTestApp();
  });

  afterEach(() => {
    env.close();
    globalThis.fetch = originalFetch;
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("forwards GET /oc/foo to opencodeApiBase and strips Set-Cookie", async () => {
    const fetchMock = vi.fn(async () =>
      new Response('{"ok":true}', {
        status: 200,
        headers: {
          "content-type": "application/json",
          "set-cookie": "session=abc; Path=/",
        },
      }),
    );
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const res = await env.app.request("/oc/foo?bar=baz", {
      headers: { host: "cloudy.test" },
    });

    expect(res.status).toBe(200);
    expect(await res.text()).toBe('{"ok":true}');
    expect(res.headers.get("set-cookie")).toBeNull();
    expect(res.headers.get("access-control-allow-origin")).toBe("*");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calls = fetchMock.mock.calls as unknown as [Request, RequestInit][];
    expect(calls.length).toBeGreaterThan(0);
    const upstream = calls[0]![0];
    expect(upstream.url).toBe("http://opencode.test/foo?bar=baz");
    expect(upstream.method).toBe("GET");
  });

  it("returns 400 when opencodeApiBase is empty", async () => {
    const local = createTestApp({ opencodeApiBase: "" });

    const res = await local.app.request("/oc/foo", {
      headers: { host: "cloudy.test" },
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toMatchObject({ error: expect.stringMatching(/opencodeApiBase/) });
    local.close();
  });

  it("responds to OPTIONS preflight with 204 and does not call upstream", async () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    // The Hono `cors` middleware intercepts OPTIONS and short-circuits to 204
    // before any feature route runs. Send an Origin so the echoed CORS header
    // is set, mirroring real preflight requests.
    const res = await env.app.request("/oc/anything", {
      method: "OPTIONS",
      headers: { origin: "https://app.test", host: "cloudy.test" },
    });

    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBe("https://app.test");
    expect(res.headers.get("access-control-allow-methods")).toMatch(/GET/);
    expect(res.headers.get("access-control-allow-headers")).toContain(
      "x-opencode-directory",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
