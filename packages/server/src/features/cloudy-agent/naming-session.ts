import type { LLMClient } from "../../lib/llm-provider";

export async function namingSession(
  model: string,
  provider: LLMClient,
  firstMessage: string,
  signal?: AbortSignal,
): Promise<string> {
  if (signal?.aborted) {
    throw signal.reason ?? new DOMException("Aborted", "AbortError");
  }

  const prompt = `
        Generate a short, descriptive session title based on the user's message.
        Use the same language as the user.
        Maximum 6 words.
        Return only the title, without quotes or explanations.

        <user_message>
        ${firstMessage}
        </user_message>
        `;

  let timeout: ReturnType<typeof setTimeout> | undefined;
  let onAbort: (() => void) | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error("Timeout")), 15_000);
    onAbort = () =>
      reject(signal?.reason ?? new DOMException("Aborted", "AbortError"));
    signal?.addEventListener("abort", onAbort, { once: true });
  });

  try {
    return await Promise.race([
      provider.chat({ model, signal, message: prompt }),
      timeoutPromise,
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
    if (onAbort) signal?.removeEventListener("abort", onAbort);
  }
}
