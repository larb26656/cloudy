import type { IncomingMessage, ServerResponse } from "node:http";
import {
  validateIdentityToken,
  writeCredentials,
} from "../../../lib/siwc/credentials";
import type { ChatGPTCredentials } from "../../../lib/siwc/credentials";

const OAUTH_TOKEN_URL = "https://auth.openai.com/api/accounts/oauth/token";
const RESOURCE = "https://api.openai.com/v1";

type OAuthCallbackOptions = {
  state: string;
  nonce: string;
  verifier: string;
  redirectUri: () => string;
  savedCredentials?: ChatGPTCredentials;
  credentialsPath: string;
  hostId: string;
  activate: () => Promise<void>;
  finishPending: (error?: string) => void;
};

export function createOAuthCallbackHandler(options: OAuthCallbackOptions) {
  return async (request: IncomingMessage, response: ServerResponse) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    if (url.pathname !== "/auth/callback") {
      response.writeHead(404).end();
      return;
    }

    let errorMessage: string | undefined;
    try {
      if (url.searchParams.get("state") !== options.state)
        throw new Error("Invalid OAuth state");
      const oauthError = url.searchParams.get("error");
      if (oauthError)
        throw new Error(
          oauthError === "access_denied"
            ? "ChatGPT plan access was declined"
            : oauthError,
        );
      const code = url.searchParams.get("code");
      const callbackClientId = url.searchParams.get("client_id");
      const clientId = options.savedCredentials?.client_id ?? callbackClientId;
      if (
        !code ||
        !clientId ||
        clientId === "dynamic_agent_client" ||
        (callbackClientId && callbackClientId !== clientId)
      ) {
        throw new Error(
          "ChatGPT registration did not return the expected issued client ID",
        );
      }
      const tokenResponse = await fetch(OAUTH_TOKEN_URL, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: clientId,
          code,
          code_verifier: options.verifier,
          redirect_uri: options.redirectUri(),
          resource: RESOURCE,
        }),
      });
      if (!tokenResponse.ok)
        throw new Error(
          `ChatGPT authorization failed (${tokenResponse.status})`,
        );
      const tokens = (await tokenResponse.json()) as {
        access_token: string;
        refresh_token: string;
        id_token: string;
        expires_in: number;
        scope: string;
      };
      const scopes = tokens.scope.split(" ").filter(Boolean);
      if (!scopes.includes("chatgpt.tokens.use.direct"))
        throw new Error("ChatGPT plan usage permission was not granted");
      const identity = await validateIdentityToken(
        tokens.id_token,
        clientId,
        options.nonce,
      );
      console.info(
        "[ChatGPT plan] Writing credentials",
        options.credentialsPath,
      );
      await writeCredentials(options.credentialsPath, {
        client_id: clientId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        id_token: tokens.id_token,
        subject: identity.subject,
        ...(identity.email ? { email: identity.email } : {}),
        scopes,
        expires_at: Date.now() + tokens.expires_in * 1000,
        ext_agent_host_id: options.hostId,
      });
      console.info("[ChatGPT plan] Credentials saved", options.credentialsPath);
      await options.activate();
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "ChatGPT sign-in failed";
    } finally {
      options.finishPending(errorMessage);
    }

    response.writeHead(errorMessage ? 400 : 200, {
      "content-type": "text/html; charset=utf-8",
    });
    response.end(
      errorMessage
        ? `<h2>ChatGPT sign-in failed.</h2><p>${escapeHtml(errorMessage)}</p><p>You can return to Cloudy.</p>`
        : "<h2>ChatGPT sign-in complete. You can return to Cloudy.</h2>",
    );
  };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character] ?? character;
  });
}
