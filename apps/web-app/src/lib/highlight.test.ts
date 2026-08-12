import { describe, expect, it } from "vitest";
import { getRefractorLanguage, highlightCode } from "./highlight";

describe("highlight", () => {
  it("highlights registered languages with refractor tokens", () => {
    expect(highlightCode("const value = true;", "typescript")).toContain(
      '<span class="token keyword">const</span>',
    );
  });

  it("escapes plain text without highlighting it", () => {
    expect(highlightCode('<script>alert("x")</script>', "plaintext")).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;",
    );
  });

  it("maps file extensions to refractor language names", () => {
    expect(getRefractorLanguage("component.tsx")).toBe("tsx");
    expect(getRefractorLanguage("template.html")).toBe("markup");
    expect(getRefractorLanguage("README.unknown")).toBeNull();
  });
});
