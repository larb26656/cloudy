import { chmod, readFile, writeFile, mkdir, rename } from "node:fs/promises";
import path from "node:path";
import { randomBytes, createHash } from "node:crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";

export interface ChatGPTCredentials {
  client_id: string;
  access_token: string;
  refresh_token: string;
  id_token: string;
  email?: string;
  subject: string;
  scopes: string[];
  expires_at: number;
  ext_agent_host_id: string;
}

const refreshes = new Map<string, Promise<string>>();

export const createPkce = () => {
  const verifier = randomBytes(32).toString("base64url");
  return {
    verifier,
    challenge: createHash("sha256").update(verifier).digest("base64url"),
  };
};

export async function validateIdentityToken(
  token: string,
  clientId: string,
  nonce: string,
) {
  const jwks = createRemoteJWKSet(
    new URL("https://auth.openai.com/.well-known/jwks.json"),
  );
  const { payload } = await jwtVerify(token, jwks, {
    issuer: "https://auth.openai.com",
    audience: clientId,
  });
  if (payload.nonce !== nonce || typeof payload.sub !== "string")
    throw new Error("ChatGPT identity token validation failed");
  return {
    subject: payload.sub,
    email: typeof payload.email === "string" ? payload.email : undefined,
  };
}

async function validateRefreshedIdentityToken(
  token: string,
  clientId: string,
  subject: string,
) {
  const jwks = createRemoteJWKSet(
    new URL("https://auth.openai.com/.well-known/jwks.json"),
  );
  const { payload } = await jwtVerify(token, jwks, {
    issuer: "https://auth.openai.com",
    audience: clientId,
  });
  if (payload.sub !== subject)
    throw new Error("ChatGPT account identity changed during token refresh");
}

export async function writeCredentials(
  filePath: string,
  value: ChatGPTCredentials,
) {
  await mkdir(path.dirname(filePath), { recursive: true, mode: 0o700 });
  const temporaryPath = `${filePath}.${randomBytes(8).toString("hex")}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(value), { mode: 0o600 });
  await chmod(temporaryPath, 0o600);
  await rename(temporaryPath, filePath);
}

export async function readCredentials(filePath: string) {
  return JSON.parse(await readFile(filePath, "utf8")) as ChatGPTCredentials;
}

export async function readChatGPTAccessToken(
  filePath: string,
): Promise<string> {
  const activeRefresh = refreshes.get(filePath);
  if (activeRefresh) return activeRefresh;
  const refresh = refreshChatGPTAccessToken(filePath);
  refreshes.set(filePath, refresh);
  try {
    return await refresh;
  } finally {
    refreshes.delete(filePath);
  }
}

async function refreshChatGPTAccessToken(filePath: string): Promise<string> {
  let credentials = await readCredentials(filePath);
  if (credentials.expires_at < Date.now() + 60_000) {
    const response = await fetch(
      "https://auth.openai.com/api/accounts/oauth/token",
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: credentials.client_id,
          refresh_token: credentials.refresh_token,
          resource: "https://api.openai.com/v1",
        }),
      },
    );
    if (!response.ok)
      throw new Error(`ChatGPT token refresh failed (${response.status})`);
    const tokens = (await response.json()) as {
      access_token: string;
      refresh_token: string;
      id_token: string;
      expires_in: number;
      scope: string;
    };
    await validateRefreshedIdentityToken(
      tokens.id_token,
      credentials.client_id,
      credentials.subject,
    );
    credentials = {
      ...credentials,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      id_token: tokens.id_token,
      scopes: tokens.scope.split(" ").filter(Boolean),
      expires_at: Date.now() + tokens.expires_in * 1000,
    };
    await writeCredentials(filePath, credentials);
  }
  if (!credentials.scopes.includes("chatgpt.tokens.use.direct"))
    throw new Error("ChatGPT plan usage permission is not enabled");
  return credentials.access_token;
}
