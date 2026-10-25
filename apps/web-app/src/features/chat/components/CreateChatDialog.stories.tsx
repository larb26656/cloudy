import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { within } from "storybook/test";
import preview from "@/storybook/preview";
import { Button } from "@repo/ui/components/button";
import { CreateChatDialog } from "./CreateChatDialog";

function CreateChatDialogDemo() {
  const [open, setOpen] = useState(true);
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-[520px] items-center justify-center">
        {!open && <Button onClick={() => setOpen(true)}>Open dialog</Button>}
        <CreateChatDialog
          open={open}
          onOpenChange={setOpen}
          onSubmit={() => setOpen(false)}
        />
      </div>
    </QueryClientProvider>
  );
}

const meta = preview.meta({
  title: "Chat/CreateChatDialog",
  component: CreateChatDialogDemo,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    msw: {
      handlers: [
        http.get("*/api/agent-providers", () =>
          HttpResponse.json({
            providers: [
              {
                id: "opencode",
                name: "OpenCode",
                capabilities: { requiresDirectory: true },
              },
            ],
          }),
        ),
        http.get("*/api/workspaces", () => HttpResponse.json(workspaces)),
        http.get("*/api/sessions", ({ request }) => {
          const directory = new URL(request.url).searchParams.get("directory");
          return HttpResponse.json(
            directory === "/Users/demo/cloudy" ? sessions : [],
          );
        }),
      ],
    },
  },
});

export default meta;

export const Default = meta.story({});

export const ChooseWorkspace = meta.story({
  play: async ({ canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      body.getByRole("button", { name: /use existing workspace/i }),
    );
    await body.findByText("Cloudy");
  },
});

export const WorkspaceEmpty = meta.story({
  parameters: {
    msw: {
      handlers: [http.get("*/api/workspaces", () => HttpResponse.json([]))],
    },
  },
  play: async ({ canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      body.getByRole("button", { name: /use existing workspace/i }),
    );
    await body.findByText("No agent workspaces yet");
  },
});

export const OpenByPath = meta.story({
  play: async ({ canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(body.getByRole("button", { name: /open by path/i }));
    await body.findByRole("textbox", { name: "Chat directory" });
  },
});

export const SessionPicker = meta.story({
  play: async ({ canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      body.getByRole("button", { name: /use existing workspace/i }),
    );
    await userEvent.click(await body.findByRole("button", { name: "Cloudy" }));
    await body.findByRole("button", { name: "Refine chat creation flow" });
  },
});

export const SessionEmpty = meta.story({
  parameters: {
    msw: {
      handlers: [
        http.get("*/api/agent-providers", () =>
          HttpResponse.json({
            providers: [
              {
                id: "opencode",
                name: "OpenCode",
                capabilities: { requiresDirectory: true },
              },
            ],
          }),
        ),
        http.get("*/api/workspaces", () => HttpResponse.json(workspaces)),
        http.get("*/api/sessions", () => HttpResponse.json([])),
      ],
    },
  },
  play: async ({ canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      body.getByRole("button", { name: /use existing workspace/i }),
    );
    await userEvent.click(await body.findByRole("button", { name: "Cloudy" }));
    await body.findByText("No sessions in this workspace");
  },
});

const workspaces = [
  {
    id: "cloudy-workspace",
    name: "Cloudy",
    color: "#3079fa",
    type: "agent",
    directory: "/Users/demo/cloudy",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "docs-workspace",
    name: "Product docs",
    color: "#16a34a",
    type: "agent",
    directory: "/Users/demo/product-docs",
    createdAt: "2025-01-02T00:00:00.000Z",
    updatedAt: "2025-01-02T00:00:00.000Z",
  },
];

const sessions = [
  {
    id: "session-1",
    providerId: "opencode",
    title: "Refine chat creation flow",
    directory: "/Users/demo/cloudy",
    parentId: null,
    status: "idle",
    runStatus: "idle",
    updatedAt: "2025-01-02T00:00:00.000Z",
  },
  {
    id: "session-2",
    providerId: "opencode",
    title: "Update Storybook stories",
    directory: "/Users/demo/cloudy",
    parentId: null,
    status: "idle",
    runStatus: "idle",
    updatedAt: "2025-01-01T00:00:00.000Z",
  },
];
