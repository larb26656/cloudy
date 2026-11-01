import { expect } from "storybook/test";
import preview from "@/storybook/preview";
import { AgentActivityIndicator } from "./AgentActivityIndicator";

const meta = preview.meta({
  title: "Chat/AgentActivityIndicator",
  component: AgentActivityIndicator,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
});

export default meta;

export const Working = meta.story({
  args: { state: "working" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("img", { name: "Working" })).toBeVisible();
  },
});

export const WaitingForPermission = meta.story({
  args: { state: "wait-for-human", reason: "permission" },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("img", { name: "Permission required" }),
    ).toBeVisible();
  },
});

export const WaitingForQuestion = meta.story({
  args: { state: "wait-for-human", reason: "question" },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("img", { name: "Question waiting" }),
    ).toBeVisible();
  },
});

export const Idle = meta.story({ args: { state: "idle" } });
