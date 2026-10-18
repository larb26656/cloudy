import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { LLMProviderSettings } from "./LLMProviderSettings";

const mocks = vi.hoisted(() => ({
  settings: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  setDefault: vi.fn(),
}));

vi.mock("@/hooks/queries/useLLMProviderSettings", () => ({
  useLLMProviderSettings: mocks.settings,
  useCreateLLMConnection: () => ({ mutate: mocks.create, isPending: false }),
  useUpdateLLMConnection: () => ({ mutate: mocks.update }),
  useDeleteLLMConnection: () => ({ mutate: mocks.remove }),
  useSetLLMDefault: () => ({ mutate: mocks.setDefault }),
}));

describe("LLMProviderSettings", () => {
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
        default: { connectionId: "connection-1", modelId: "custom-model" },
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

    render(<LLMProviderSettings />);

    expect(
      screen.getByRole("combobox", { name: "Primary default model" }),
    ).toHaveTextContent("custom-model");
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
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
        default: null,
        providerTypes: [{ id: "openai", name: "OpenAI", configFields: [] }],
      },
      isPending: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<LLMProviderSettings />);
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
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
