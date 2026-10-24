import OpenAI from "openai";
import { z } from "zod";
import { readChatGPTAccessToken } from "../../siwc/credentials";
import type { ChatInput, LLMProviderDefinition } from "../types";

const configSchema = z.object({
  apiKey: z.string().min(1),
  baseURL: z.url().optional(),
});

type OpenAIConfig = z.infer<typeof configSchema>;

export const openaiProviderDefinition = {
  configSchema,
  settings: {
    name: "OpenAI-compatible",
    configFields: [
      {
        key: "apiKey",
        label: "API key",
        type: "secret" as const,
        required: true,
      },
      { key: "baseURL", label: "Base URL", type: "url" as const },
    ],
  },

  create(config) {
    const client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    });

    return {
      async chat(input) {
        const response = await client.chat.completions.create({
          model: input.model,
          messages: input.messages ?? [
            { role: "user", content: input.message },
          ],
          ...(input.signal ? { signal: input.signal } : {}),
        });

        return response.choices[0]?.message.content ?? "";
      },

      async *chatAsync(input) {
        const stream = await client.chat.completions.create(
          {
            model: input.model,
            messages: input.messages ?? [
              { role: "user", content: input.message },
            ],
            stream: true,
          },
          input.signal ? { signal: input.signal } : undefined,
        );

        for await (const chunk of stream) {
          yield {
            text: chunk.choices[0]?.delta?.content ?? "",
          };
        }
      },
    };
  },
} satisfies LLMProviderDefinition<OpenAIConfig>;

export const chatgptPlanProviderDefinition: LLMProviderDefinition<{
  credentialPath: string;
}> = {
  configSchema: z.object({ credentialPath: z.string().min(1) }),
  settings: { name: "ChatGPT plan", configFields: [] },
  create({ credentialPath }) {
    async function* chatAsync(input: ChatInput) {
      const token = await readChatGPTAccessToken(credentialPath);
      const client = new OpenAI({ apiKey: token, maxRetries: 0 });
      const messages = input.messages ?? [
        { role: "user" as const, content: input.message },
      ];
      const instructions = messages
        .filter((message) => message.role === "system")
        .map((message) => message.content)
        .join("\n\n");
      const stream = await client.responses.create(
        {
          model: input.model,
          input: messages
            .filter((message) => message.role !== "system")
            .map((message) => ({
              role: message.role,
              content: message.content,
            })),
          ...(instructions ? { instructions } : {}),
          store: false,
          stream: true,
        },
        input.signal ? { signal: input.signal } : undefined,
      );
      let completed = false;
      for await (const event of stream) {
        if (event.type === "response.output_text.delta")
          yield { text: event.delta };
        if (event.type === "response.completed") completed = true;
        if (event.type === "response.failed")
          throw new Error(
            event.response.error?.message ?? "ChatGPT response failed",
          );
        if (event.type === "response.incomplete")
          throw new Error("ChatGPT response was incomplete");
      }
      if (!completed) throw new Error("ChatGPT stream ended before completion");
    }

    return {
      async chat(input) {
        let text = "";
        for await (const chunk of chatAsync(input)) text += chunk.text;
        return text;
      },
      chatAsync,
    };
  },
};
