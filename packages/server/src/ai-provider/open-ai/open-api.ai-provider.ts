import OpenAI from "openai";
import type { ApiProviderAdapter } from "../type";

export function createOpenAiProvider({
  baseURL,
  apiKey,
}: {
  baseURL?: string;
  apiKey: string;
}): ApiProviderAdapter {
  const client = new OpenAI({
    apiKey,
    baseURL,
  });

  return {
    async chat(input) {
      const stream = await client.chat.completions.create({
        model: input.model,
        messages: [
          {
            role: "user",
            content: input.message,
          },
        ],
      });

      return stream.choices[0]?.message.content ?? "";
    },

    async *chatAsync(input) {
      const stream = await client.chat.completions.create({
        model: input.model,
        messages: [
          {
            role: "user",
            content: input.message,
          },
        ],
        stream: true,
      });

      for await (const chunk of stream) {
        yield {
          text: chunk.choices[0]?.delta?.content ?? "",
        };
      }
    },
  };
}
