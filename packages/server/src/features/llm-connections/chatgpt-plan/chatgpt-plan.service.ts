import path from "node:path";
import { unlink } from "node:fs/promises";
import type { Server } from "node:http";
import {
  readChatGPTAccessToken,
  readCredentials,
} from "../../../lib/siwc/credentials";
import type { LLM } from "../../../lib/llm-provider";
import { ConflictError } from "../../../shared/domain-error";
import { startOAuthLogin } from "./chatgpt-plan.oauth-login";

const RESOURCE = "https://api.openai.com/v1";

export function createChatGPTPlanService(configDir: string, llm: LLM) {
  const credentialsPath = path.join(configDir, "chatgpt-plan-credentials.json");
  const hostIdPath = path.join(configDir, "chatgpt-plan-host-id");
  let pending = false;
  let lastError: string | undefined;
  let callbackServer: Server | undefined;
  let pendingTimeout: ReturnType<typeof setTimeout> | undefined;

  const finishPending = (error?: string) => {
    pending = false;
    lastError = error;
    if (pendingTimeout) clearTimeout(pendingTimeout);
    pendingTimeout = undefined;
    callbackServer?.close();
    callbackServer = undefined;
  };

  const activate = async () => {
    try {
      const accessToken = await readChatGPTAccessToken(credentialsPath);
      const response = await fetch(`${RESOURCE}/models`, {
        headers: { authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok)
        throw new Error(`Could not load ChatGPT models (${response.status})`);
      const body = (await response.json()) as {
        models?: { slug: string; display_name: string; visibility: string }[];
      };
      const models = (body.models ?? []).filter(
        (model) => model.visibility === "list",
      );
      if (!models.length)
        throw new Error("No ChatGPT plan models are available");
      llm.registerClient(
        {
          id: "chatgpt-plan",
          type: "chatgpt-plan",
          config: { credentialPath: credentialsPath },
          models: models.map(({ slug, display_name }) => ({
            modelId: slug,
            name: display_name,
            providerName: "ChatGPT plan",
          })),
        },
        true,
      );
      lastError = undefined;
    } catch (error) {
      llm.deleteClient("chatgpt-plan");
      throw error;
    }
  };

  return {
    async status() {
      try {
        const credentials = await readCredentials(credentialsPath);
        return {
          connected: Boolean(llm.getClient("chatgpt-plan")),
          connecting: pending,
          email: credentials.email ?? null,
          error: lastError ?? null,
        };
      } catch {
        return {
          connected: false,
          connecting: pending,
          email: null,
          error: lastError ?? null,
        };
      }
    },
    async registerConfiguredConnection() {
      try {
        await activate();
      } catch (error) {
        lastError =
          error instanceof Error
            ? error.message
            : "ChatGPT connection could not be restored";
      }
    },
    async connect() {
      if (pending)
        throw new ConflictError("ChatGPT sign-in is already in progress");
      pending = true;
      lastError = undefined;
      console.info("[ChatGPT plan] Starting sign-in", {
        configDir,
        hostIdPath,
        credentialsPath,
      });
      return startOAuthLogin({
        configDir,
        credentialsPath,
        activate,
        finishPending,
        setCallbackServer: (server) => {
          callbackServer = server;
        },
        setPendingTimeout: (timeout) => {
          pendingTimeout = timeout;
        },
      });
    },
    async cancel() {
      finishPending();
      return { connecting: false };
    },
    async disconnect() {
      finishPending();
      llm.deleteClient("chatgpt-plan");
      try {
        const credentials = await readCredentials(credentialsPath);
        const config = (await fetch(
          "https://auth.openai.com/.well-known/openid-configuration",
        ).then((result) => result.json())) as { revocation_endpoint?: string };
        if (config.revocation_endpoint)
          await fetch(config.revocation_endpoint, {
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              token: credentials.refresh_token,
              token_type_hint: "refresh_token",
              client_id: credentials.client_id,
            }),
          });
      } finally {
        await unlink(credentialsPath).catch(() => undefined);
      }
      return { connected: false };
    },
  };
}

export type ChatGPTPlanService = ReturnType<typeof createChatGPTPlanService>;
