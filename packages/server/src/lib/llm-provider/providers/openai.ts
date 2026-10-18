import OpenAI from "openai";
import { z } from "zod";
import type { LLMProviderDefinition } from "../types";

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
