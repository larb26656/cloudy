import { render, screen } from "@testing-library/react";
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
    ).toHaveValue("custom-model");
    expect(
      screen.getByPlaceholderText(/API key configured/),
    ).toBeInTheDocument();
    expect(screen.queryByDisplayValue("private-key")).not.toBeInTheDocument();
  });
});
