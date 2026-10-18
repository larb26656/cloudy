import OpenAI from "openai";
import { z } from "zod";
import { LLMProviderDefinition } from "../types";

const configSchema = z.object({
  apiKey: z.string().min(1),
  baseURL: z.url().optional(),
});

type OpenAIConfig = z.infer<typeof configSchema>;

export const openaiProviderDefinition = {
  configSchema,

  create(config) {
    const client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    });

    return {
      async chat(input) {
        const response = await client.chat.completions.create({
          model: input.model,
          messages: [
            {
              role: "user",
              content: input.message,
            },
          ],
        });

        return response.choices[0]?.message.content ?? "";
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
  },
} satisfies LLMProviderDefinition<OpenAIConfig>;
