import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { LLMConnectionSettings } from "./LLMConnectionSettings";

const mocks = vi.hoisted(() => ({
  settings: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  connectChatGPT: vi.fn(),
  disconnectChatGPT: vi.fn(),
}));

vi.mock("@/hooks/queries/useLLMConnectionSettings", () => ({
  useLLMConnectionSettings: mocks.settings,
  useCreateLLMConnection: () => ({ mutate: mocks.create, isPending: false }),
  useUpdateLLMConnection: () => ({ mutate: mocks.update }),
  useDeleteLLMConnection: () => ({ mutate: mocks.remove }),
  useChatGPTPlanStatus: () => ({
    data: { connected: false, connecting: false, email: null, error: null },
  }),
  useConnectChatGPTPlan: () => ({
    mutate: mocks.connectChatGPT,
    isPending: false,
  }),
  useDisconnectChatGPTPlan: () => ({
    mutate: mocks.disconnectChatGPT,
    isPending: false,
  }),
}));

describe("LLMConnectionSettings", () => {
  it("shows saved connection details without rendering the API key", () => {
    mocks.settings.mockReturnValue({
      data: {
        connections: [
          {
            id: "connection-1",
            name: "Primary",
            type: "openai",
            config: { baseURL: "https://api.example.com/v1" },
            secretsConfigured: { apiKey: true },
            modelIds: ["custom-model", "other-model"],
          },
        ],
        providerTypes: [
          {
            id: "openai",
            name: "OpenAI-compatible",
            configFields: [
              {
                key: "apiKey",
                label: "API key",
                type: "secret",
                required: true,
              },
              { key: "baseURL", label: "Base URL", type: "url" },
            ],
          },
        ],
      },
      isPending: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<LLMConnectionSettings />);

    expect(screen.getByText("2 models available")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "More actions for Primary" }),
    );
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit provider" }));
    expect(screen.getByRole("textbox", { name: "Model 1" })).toHaveValue(
      "custom-model",
    );
    expect(screen.getByRole("textbox", { name: "Model 2" })).toHaveValue(
      "other-model",
    );
    expect(
      screen.getByPlaceholderText(/enter replacement/),
    ).toBeInTheDocument();
    expect(screen.queryByDisplayValue("private-key")).not.toBeInTheDocument();
  });

  it("allows editing saved model IDs and saves them", async () => {
    mocks.settings.mockReturnValue({
      data: {
        connections: [
          {
            id: "connection-1",
            name: "Primary",
            type: "openai",
            config: {},
            secretsConfigured: {},
            modelIds: ["old-model"],
          },
        ],
        providerTypes: [{ id: "openai", name: "OpenAI", configFields: [] }],
      },
      isPending: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<LLMConnectionSettings />);
    fireEvent.click(
      screen.getByRole("button", { name: "More actions for Primary" }),
    );
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit provider" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Model 1" }), {
      target: { value: "new-model" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(mocks.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "connection-1",
          modelIds: ["new-model"],
        }),
        expect.any(Object),
      );
    });
  });
});
