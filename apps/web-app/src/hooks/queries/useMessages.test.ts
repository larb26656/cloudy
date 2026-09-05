import { describe, expect, test } from "vitest";
import { buildParts } from "./useMessages";
import type { ChatInputContent } from "@/lib/opencode";

describe("buildParts", () => {
  test("yields a text part and no file parts when content has no mentions or attachments", () => {
    const content: ChatInputContent = {
      text: "hello",
      mentions: [],
      attachments: [],
    };

    const parts = buildParts("/proj", content);

    expect(parts).toEqual([{ type: "text", text: "hello" }]);
  });

  test("maps attachments to FilePartInput with mime/url/filename populated", () => {
    const content: ChatInputContent = {
      text: "look",
      mentions: [],
      attachments: [
        {
          id: "att_1",
          mime: "image/png",
          filename: "x.png",
          dataUrl: "data:image/png;base64,AAA",
        },
      ],
    };

    const parts = buildParts("/proj", content);

    expect(parts[0]).toEqual({ type: "text", text: "look" });
    expect(parts[parts.length - 1]).toEqual({
      type: "file",
      mime: "image/png",
      url: "data:image/png;base64,AAA",
      filename: "x.png",
    });
  });
});
