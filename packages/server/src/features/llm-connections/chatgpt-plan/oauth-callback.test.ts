import type { IncomingMessage, ServerResponse } from "node:http";
import { describe, expect, it, vi } from "vitest";
import { createOAuthCallbackHandler } from "./oauth-callback";

vi.mock("../../../lib/siwc/credentials", () => ({
  validateIdentityToken: vi.fn().mockResolvedValue({
    subject: "account-id",
    email: "person@example.com",
  }),
  writeCredentials: vi.fn().mockResolvedValue(undefined),
}));

function createResponse() {
  const response = {
    writeHead: vi.fn().mockReturnThis(),
    end: vi.fn(),
  };
  return response as unknown as ServerResponse & typeof response;
}

describe("ChatGPT OAuth callback", () => {
  it("rejects requests outside the callback path", async () => {
    const finishPending = vi.fn();
    const handler = createOAuthCallbackHandler({
      state: "expected-state",
      nonce: "nonce",
      verifier: "verifier",
      redirectUri: () => "http://127.0.0.1/callback",
      credentialsPath: "/tmp/credentials.json",
      hostId: "host-id",
      activate: vi.fn(),
      finishPending,
    });
    const response = createResponse();

    await handler({ url: "/wrong-path" } as IncomingMessage, response);

    expect(response.writeHead).toHaveBeenCalledWith(404);
    expect(finishPending).not.toHaveBeenCalled();
  });

  it("escapes OAuth error text in the response", async () => {
    const finishPending = vi.fn();
    const handler = createOAuthCallbackHandler({
      state: "expected-state",
      nonce: "nonce",
      verifier: "verifier",
      redirectUri: () => "http://127.0.0.1/callback",
      credentialsPath: "/tmp/credentials.json",
      hostId: "host-id",
      activate: vi.fn(),
      finishPending,
    });
    const response = createResponse();

    await handler(
      {
        url: "/auth/callback?state=expected-state&error=%3Cscript%3E",
      } as IncomingMessage,
      response,
    );

    expect(response.writeHead).toHaveBeenCalledWith(400, {
      "content-type": "text/html; charset=utf-8",
    });
    expect(response.end).toHaveBeenCalledWith(
      expect.stringContaining("&lt;script&gt;"),
    );
    expect(finishPending).toHaveBeenCalledWith("<script>");
  });

  it("maps access denial to a user-facing error", async () => {
    const finishPending = vi.fn();
    const handler = createOAuthCallbackHandler({
      state: "expected-state",
      nonce: "nonce",
      verifier: "verifier",
      redirectUri: () => "http://127.0.0.1/callback",
      credentialsPath: "/tmp/credentials.json",
      hostId: "host-id",
      activate: vi.fn(),
      finishPending,
    });
    const response = createResponse();

    await handler(
      {
        url: "/auth/callback?state=expected-state&error=access_denied",
      } as IncomingMessage,
      response,
    );

    expect(finishPending).toHaveBeenCalledWith(
      "ChatGPT plan access was declined",
    );
    expect(response.writeHead).toHaveBeenCalledWith(400, expect.any(Object));
  });
});
