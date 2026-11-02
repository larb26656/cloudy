import { describe, expect, test } from "vitest";
import { emptyResponse, jsonResponse } from "./api-response";

describe("API response errors", () => {
  test("extracts a JSON error from empty responses", async () => {
    const response = new Response(JSON.stringify({ error: "Cannot abort" }), { status: 409 });
    await expect(emptyResponse(response)).rejects.toThrow("Cannot abort");
  });

  test("preserves non-JSON response text", async () => {
    const response = new Response("Service unavailable", { status: 503 });
    await expect(jsonResponse(response)).rejects.toThrow("Service unavailable");
  });
});
