import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import path from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createPkce, readCredentials } from "../../../lib/siwc/credentials";
import { createOAuthCallbackHandler } from "./chatgpt-plan.oauth-callback";
import type { Server } from "node:http";

const RESOURCE = "https://api.openai.com/v1";

async function getOrCreateHostId(hostIdPath: string) {
  try {
    return { hostId: await readFile(hostIdPath, "utf8"), created: false };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  const hostId = `urn:uuid:${randomUUID()}`;
  try {
    await writeFile(hostIdPath, hostId, { mode: 0o600, flag: "wx" });
    return { hostId, created: true };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    return { hostId: await readFile(hostIdPath, "utf8"), created: false };
  }
}

function openBrowser(url: string) {
  const command =
    process.platform === "darwin"
      ? "open"
      : process.platform === "win32"
        ? "cmd"
        : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];
  execFile(command, args, (error) => {
    if (error)
      console.error(
        "Could not open ChatGPT sign-in in a browser",
        error.message,
      );
  });
}

type StartOAuthLoginOptions = {
  configDir: string;
  credentialsPath: string;
  activate: () => Promise<void>;
  finishPending: (error?: string) => void;
  setCallbackServer: (server: Server) => void;
  setPendingTimeout: (timeout: ReturnType<typeof setTimeout>) => void;
};

export async function startOAuthLogin(options: StartOAuthLoginOptions) {
  const hostIdPath = path.join(options.configDir, "chatgpt-plan-host-id");
  let hostId: string;
  try {
    await mkdir(path.dirname(hostIdPath), { recursive: true, mode: 0o700 });
    console.info(
      "[ChatGPT plan] Config directory ready",
      path.dirname(hostIdPath),
    );
    const result = await getOrCreateHostId(hostIdPath);
    hostId = result.hostId;
    console.info(
      `[ChatGPT plan] ${result.created ? "Created" : "Reusing"} host ID`,
      hostIdPath,
    );
  } catch (error) {
    console.error("[ChatGPT plan] Could not prepare config files", {
      hostIdPath,
      error: error instanceof Error ? error.message : String(error),
    });
    options.finishPending(
      error instanceof Error
        ? error.message
        : "Could not prepare ChatGPT sign-in",
    );
    throw error;
  }

  const pkce = createPkce();
  const state = randomBytes(32).toString("base64url");
  const nonce = randomBytes(32).toString("base64url");
  let savedCredentials: Awaited<ReturnType<typeof readCredentials>> | undefined;
  try {
    savedCredentials = await readCredentials(options.credentialsPath);
  } catch {
    savedCredentials = undefined;
  }

  let redirectUri = "";
  const server = createServer(
    createOAuthCallbackHandler({
      state,
      nonce,
      verifier: pkce.verifier,
      redirectUri: () => redirectUri,
      savedCredentials,
      credentialsPath: options.credentialsPath,
      hostId,
      activate: options.activate,
      finishPending: options.finishPending,
    }),
  );
  options.setCallbackServer(server);
  try {
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
  } catch (error) {
    options.finishPending(
      error instanceof Error
        ? error.message
        : "Could not start ChatGPT sign-in",
    );
    throw error;
  }

  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Could not start OAuth callback listener");
  redirectUri = `http://127.0.0.1:${address.port}/auth/callback`;
  const query = new URLSearchParams({
    client_id: savedCredentials?.client_id ?? "dynamic_agent_client",
    ...(!savedCredentials ? { agent_name_hint: "Cloudy" } : {}),
    ...(savedCredentials?.id_token
      ? { id_token_hint: savedCredentials.id_token }
      : {}),
    ...(savedCredentials?.email ? { login_hint: savedCredentials.email } : {}),
    ext_agent_host_id: hostId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope:
      "openid profile email offline_access resource.invoke chatgpt.tokens.use.direct",
    resource: RESOURCE,
    state,
    nonce,
    code_challenge_method: "S256",
    code_challenge: pkce.challenge,
  });
  const authorizeUrl = `https://auth.openai.com/api/accounts/authorize?${query}`;
  options.setPendingTimeout(
    setTimeout(
      () => {
        options.finishPending("ChatGPT sign-in timed out. Please try again.");
      },
      5 * 60 * 1000,
    ),
  );
  openBrowser(authorizeUrl);
  return { started: true };
}
