import { Hono } from "hono";
import type { ChatGPTPlanService } from "./chatgpt-plan.service";

export function createChatGPTPlanController(service: ChatGPTPlanService) {
  return new Hono()
    .get("/", async (c) => c.json(await service.status()))
    .post("/connect", async (c) => c.json(await service.connect()))
    .post("/cancel", async (c) => c.json(await service.cancel()))
    .delete("/", async (c) => c.json(await service.disconnect()));
}
