import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  readFileMock,
  writeFileMock,
  chmodMock,
  mkdirMock,
  renameMock,
  jwtVerifyMock,
} = vi.hoisted(() => ({
  readFileMock: vi.fn(),
  writeFileMock: vi.fn(),
  chmodMock: vi.fn(),
  mkdirMock: vi.fn(),
  renameMock: vi.fn(),
  jwtVerifyMock: vi.fn(),
}));

vi.mock("node:fs/promises", () => ({
  chmod: chmodMock,
  mkdir: mkdirMock,
  readFile: readFileMock,
  rename: renameMock,
  writeFile: writeFileMock,
}));

vi.mock("jose", () => ({
  createRemoteJWKSet: vi.fn(() => "jwks"),
  jwtVerify: jwtVerifyMock,
}));

import {
  createPkce,
  readChatGPTAccessToken,
  readCredentials,
  validateIdentityToken,
  writeCredentials,
} from "./credentials";
import type { ChatGPTCredentials } from "./credentials";

const credentials: ChatGPTCredentials = {
  client_id: "client-id",
  access_token: "access-token",
  refresh_token: "refresh-token",
  id_token: "id-token",
  subject: "subject-id",
  email: "person@example.com",
  scopes: ["chatgpt.tokens.use.direct"],
  expires_at: Date.now() + 60 * 60 * 1000,
  ext_agent_host_id: "host-id",
};

describe("SIWC credentials", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a PKCE verifier and matching SHA-256 challenge", () => {
    const pkce = createPkce();

    expect(pkce.verifier).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(pkce.challenge).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(pkce.challenge).not.toBe(pkce.verifier);
  });

  it("reads credentials from JSON", async () => {
    readFileMock.mockResolvedValue(JSON.stringify(credentials));

    await expect(readCredentials("/config/credentials.json")).resolves.toEqual(
      credentials,
    );
    expect(readFileMock).toHaveBeenCalledWith(
      "/config/credentials.json",
      "utf8",
    );
  });

  it("writes credentials using a restricted temporary file and atomic rename", async () => {
    await writeCredentials("/config/credentials.json", credentials);

    expect(mkdirMock).toHaveBeenCalledWith("/config", {
      recursive: true,
      mode: 0o700,
    });
    expect(writeFileMock).toHaveBeenCalledWith(
      expect.stringMatching(/^\/config\/credentials\.json\..+\.tmp$/),
      JSON.stringify(credentials),
      { mode: 0o600 },
    );
    expect(chmodMock).toHaveBeenCalledWith(
      expect.stringMatching(/^\/config\/credentials\.json\..+\.tmp$/),
      0o600,
    );
    expect(renameMock).toHaveBeenCalledWith(
      expect.stringMatching(/^\/config\/credentials\.json\..+\.tmp$/),
      "/config/credentials.json",
    );
  });

  it("returns an unexpired token when the required permission is present", async () => {
    readFileMock.mockResolvedValue(JSON.stringify(credentials));

    await expect(
      readChatGPTAccessToken("/config/credentials.json"),
    ).resolves.toBe("access-token");
    expect(jwtVerifyMock).not.toHaveBeenCalled();
  });

  it("rejects credentials without the direct token permission", async () => {
    readFileMock.mockResolvedValue(
      JSON.stringify({ ...credentials, scopes: ["openid"] }),
    );

    await expect(
      readChatGPTAccessToken("/config/credentials.json"),
    ).rejects.toThrow("ChatGPT plan usage permission is not enabled");
  });

  it("refreshes expiring credentials and persists the new tokens", async () => {
    readFileMock.mockResolvedValue(
      JSON.stringify({ ...credentials, expires_at: 0 }),
    );
    jwtVerifyMock.mockResolvedValue({ payload: { sub: "subject-id" } });
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        access_token: "new-access-token",
        refresh_token: "new-refresh-token",
        id_token: "new-id-token",
        expires_in: 3600,
        scope: "openid chatgpt.tokens.use.direct",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    try {
      await expect(
        readChatGPTAccessToken("/config/credentials.json"),
      ).resolves.toBe("new-access-token");
    } finally {
      vi.unstubAllGlobals();
    }

    expect(fetchMock).toHaveBeenCalledWith(
      "https://auth.openai.com/api/accounts/oauth/token",
      expect.objectContaining({ method: "POST" }),
    );
    expect(writeFileMock).toHaveBeenCalledWith(
      expect.stringMatching(/\.tmp$/),
      expect.stringContaining('"access_token":"new-access-token"'),
      { mode: 0o600 },
    );
  });

  it("rejects a refreshed identity that belongs to another account", async () => {
    readFileMock.mockResolvedValue(
      JSON.stringify({ ...credentials, expires_at: 0 }),
    );
    jwtVerifyMock.mockResolvedValue({ payload: { sub: "different-subject" } });
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        access_token: "new-access-token",
        refresh_token: "new-refresh-token",
        id_token: "new-id-token",
        expires_in: 3600,
        scope: "chatgpt.tokens.use.direct",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    try {
      await expect(
        readChatGPTAccessToken("/config/credentials.json"),
      ).rejects.toThrow(
        "ChatGPT account identity changed during token refresh",
      );
    } finally {
      vi.unstubAllGlobals();
    }

    expect(writeFileMock).not.toHaveBeenCalled();
  });

  it("validates identity token nonce and returns the subject and email", async () => {
    jwtVerifyMock.mockResolvedValue({
      payload: {
        sub: "subject-id",
        nonce: "expected-nonce",
        email: "person@example.com",
      },
    });

    await expect(
      validateIdentityToken("id-token", "client-id", "expected-nonce"),
    ).resolves.toEqual({ subject: "subject-id", email: "person@example.com" });
    expect(jwtVerifyMock).toHaveBeenCalledWith(
      "id-token",
      "jwks",
      expect.objectContaining({
        issuer: "https://auth.openai.com",
        audience: "client-id",
      }),
    );
  });

  it("rejects identity tokens with a mismatched nonce", async () => {
    jwtVerifyMock.mockResolvedValue({
      payload: { sub: "subject-id", nonce: "wrong" },
    });

    await expect(
      validateIdentityToken("id-token", "client-id", "expected-nonce"),
    ).rejects.toThrow("ChatGPT identity token validation failed");
  });
});
