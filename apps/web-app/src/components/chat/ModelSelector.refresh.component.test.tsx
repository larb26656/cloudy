import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ModelSelector } from "./ModelSelector";

const api = vi.hoisted(() => ({ get: vi.fn(), refresh: vi.fn() }));
vi.mock("@/lib/api", () => ({
  cloudyClient: {
    api: {
      "agent-providers": {
        $get: api.get,
        ":providerId": { models: { refresh: { $post: api.refresh } } },
      },
    },
  },
}));
vi.mock("./ChatProvider", () => ({ useChatContext: () => null }));

const provider = (name: string) => ({
  id: "fake",
  name: "Fake",
  providerType: "acp",
  capabilities: {},
  models: [
    { providerId: "fake", modelId: name.toLowerCase().replace(" ", "-"), name },
  ],
});

describe("model selector refresh", () => {
  it("shows refreshed models and retains them with a warning when refresh fails", async () => {
    api.get.mockResolvedValue({
      ok: true,
      json: async () => ({ providers: [provider("First model")] }),
    });
    api.refresh
      .mockResolvedValueOnce({
        ok: true,
        json: async () => provider("Second model"),
      })
      .mockResolvedValueOnce({ ok: false, status: 500 });
    const user = userEvent.setup();
    render(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <ModelSelector providerId="fake" open onOpenChange={() => {}} />
      </QueryClientProvider>,
    );
    expect(await screen.findByText("First model")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Refresh models" }));
    expect(await screen.findByText("Second model")).toBeInTheDocument();
    expect(screen.queryByText("First model")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Refresh models" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "model list may be out of date",
    );
    expect(screen.getByText("Second model")).toBeInTheDocument();
  });
});
