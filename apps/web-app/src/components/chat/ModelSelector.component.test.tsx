import { afterAll, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ModelSelector } from "./ModelSelector";
import { useFavoriteModelsStore } from "@/stores/favoriteModelsStore";
import { useDefaultModelStore } from "@/stores/defaultModelStore";
import type { ModelInfo, ProviderInfo } from "@repo/contracts";

const fixtures: ProviderInfo[] = [
  {
    id: "openai",
    name: "OpenAI",
    capabilities: { streaming: true },
    models: [
      {
        providerId: "openai",
        modelId: "gpt-5",
        name: "GPT-5",
        capabilities: { maxInputTokens: 400000 },
        description: "flagship",
      },
      {
        providerId: "openai",
        modelId: "gpt-5-mini",
        name: "GPT-5 mini",
        capabilities: { maxInputTokens: 400000 },
        description: "fast",
      },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    capabilities: { streaming: true },
    models: [
      {
        providerId: "anthropic",
        modelId: "claude-sonnet",
        name: "Claude Sonnet",
        capabilities: { maxInputTokens: 400000 },
        description: "balanced",
      },
      {
        providerId: "anthropic",
        modelId: "claude-opus",
        name: "Claude Opus",
        capabilities: { maxInputTokens: 400000 },
        description: "deep",
      },
    ],
  },
];

const gpt5: ModelInfo = {
  providerId: "openai",
  modelId: "gpt-5",
  name: "GPT-5",
  capabilities: { maxInputTokens: 400000 },
  description: "flagship",
  metadata: undefined,
};

const sonnet: ModelInfo = {
  providerId: "anthropic",
  modelId: "claude-sonnet",
  name: "Claude Sonnet",
  description: "balanced",
};

const originalInnerWidth = window.innerWidth;

vi.mock("@/hooks/queries/useModels", () => ({
  useModels: () => ({ data: fixtures, isLoading: false, error: null }),
}));

const mocks = vi.hoisted(() => ({
  setModel: vi.fn(),
  effectiveModel: null as ModelInfo | null,
}));

vi.mock("./ChatProvider", () => ({
  useChat: () => ({
    effectiveModel: mocks.effectiveModel,
    setModel: mocks.setModel,
  }),
}));

function renderOpen() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ModelSelector open onOpenChange={() => {}} />
    </QueryClientProvider>,
  );
}

function getByModelName(name: string) {
  const wrappers = screen
    .getAllByText(name)
    .map((el) => el.closest('[role="menuitem"]'))
    .filter((el): el is HTMLElement => el !== null);
  const item = wrappers[0];
  if (!item) throw new Error(`No menuitem contains "${name}"`);
  return item;
}

function groupByLabel(label: string): HTMLElement {
  const headings = screen.getAllByText(label);
  const wrappers = headings
    .map((h) => h.closest('[role="group"]'))
    .filter((el): el is HTMLElement => el !== null);
  const group = wrappers[0];
  if (!group) throw new Error(`No group contains "${label}"`);
  return group;
}

describe("ModelSelector — favorites", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1024,
    });
    mocks.effectiveModel = null;
    useFavoriteModelsStore.setState({ favorites: [] });
    useDefaultModelStore.setState({ defaultModels: {} });
  });

  afterAll(() => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: originalInnerWidth,
    });
  });

  test("renders all provider groups when no favorites are set", () => {
    renderOpen();

    expect(screen.queryByText("Favorites")).not.toBeInTheDocument();
    expect(screen.getByText("OpenAI")).toBeInTheDocument();
    expect(screen.getByText("Anthropic")).toBeInTheDocument();
  });

  test("shows the provider and model ID for each model", () => {
    renderOpen();

    expect(screen.getByText("gpt-5 · 400,000 context")).toBeInTheDocument();
    expect(
      screen.getByText("claude-sonnet · 400,000 context"),
    ).toBeInTheDocument();
  });

  test("shows a Favorites group on top when at least one model is favorited", () => {
    useFavoriteModelsStore.setState({ favorites: [gpt5] });
    renderOpen();

    const favoritesGroup = groupByLabel("Favorites");
    expect(favoritesGroup).toBeInTheDocument();

    const allGroupHeadings = screen.getAllByText(/OpenAI|Anthropic|Favorites/);
    const order = allGroupHeadings.map((el) => el.textContent);
    expect(order.indexOf("Favorites")).toBeLessThan(order.indexOf("OpenAI"));
    expect(order.indexOf("Favorites")).toBeLessThan(order.indexOf("Anthropic"));

    const favoriteItems = within(favoritesGroup!).getAllByRole("menuitem");
    expect(favoriteItems).toHaveLength(1);
    expect(within(favoriteItems[0]!).getByText("GPT-5")).toBeInTheDocument();
  });

  test("preserves LIFO ordering inside Favorites and deduplicates against provider groups", () => {
    useFavoriteModelsStore.setState({ favorites: [sonnet, gpt5] });
    renderOpen();

    const favoritesGroup = groupByLabel("Favorites");
    const favoriteItems = within(favoritesGroup!).getAllByRole("menuitem");
    expect(
      within(favoriteItems[0]!).getByText("Claude Sonnet"),
    ).toBeInTheDocument();
    expect(within(favoriteItems[1]!).getByText("GPT-5")).toBeInTheDocument();

    const openaiGroup = groupByLabel("OpenAI");
    const openaiItems = within(openaiGroup!).getAllByRole("menuitem");
    expect(openaiItems).toHaveLength(2);
    expect(within(openaiItems[0]!).getByText("GPT-5")).toBeInTheDocument();
  });

  test("clicking the star toggles favorite and does NOT select the model", async () => {
    const user = userEvent.setup();
    renderOpen();

    const gpt5Row = getByModelName("GPT-5");
    const star = within(gpt5Row).getByRole("button", {
      name: /add to favorites/i,
    });
    await user.click(star);

    expect(useFavoriteModelsStore.getState().favorites).toEqual([gpt5]);
    expect(mocks.setModel).not.toHaveBeenCalled();
  });

  test("the star of an already-favorited model toggles it off", async () => {
    useFavoriteModelsStore.setState({ favorites: [gpt5] });
    const user = userEvent.setup();
    renderOpen();

    const gpt5Row = getByModelName("GPT-5");
    const star = within(gpt5Row).getByRole("button", {
      name: /remove from favorites/i,
    });
    await user.click(star);

    expect(useFavoriteModelsStore.getState().favorites).toEqual([]);
  });

  test("favorite toggled from the Favorites section also reflects on the provider-group row", async () => {
    useFavoriteModelsStore.setState({ favorites: [gpt5] });
    const user = userEvent.setup();
    renderOpen();

    const favoritesGroup = groupByLabel("Favorites");
    const favoriteRow = within(favoritesGroup!).getAllByRole("menuitem")[0]!;
    const star = within(favoriteRow).getByRole("button", {
      name: /remove from favorites/i,
    });
    await user.click(star);

    expect(useFavoriteModelsStore.getState().favorites).toEqual([]);

    const openaiGroup = groupByLabel("OpenAI");
    const openaiItems = within(openaiGroup!).getAllByRole("menuitem");
    expect(within(openaiItems[0]!).getByText("GPT-5")).toBeInTheDocument();
    expect(
      within(openaiItems[0]!).getByRole("button", {
        name: /add to favorites/i,
      }),
    ).toBeInTheDocument();
  });

  test("stale favorites (model no longer in providers list) are hidden but kept in storage", () => {
    const stale: ModelInfo = {
      providerId: "openai",
      modelId: "gpt-99-deleted",
      name: "GPT-99 (gone)",
    };
    useFavoriteModelsStore.setState({ favorites: [stale, gpt5] });
    renderOpen();

    const favoritesGroup = groupByLabel("Favorites");
    const favoriteItems = within(favoritesGroup!).getAllByRole("menuitem");
    expect(favoriteItems).toHaveLength(1);
    expect(within(favoriteItems[0]!).getByText("GPT-5")).toBeInTheDocument();
    expect(
      within(favoritesGroup!).queryByText("GPT-99 (gone)"),
    ).not.toBeInTheDocument();

    expect(useFavoriteModelsStore.getState().favorites).toHaveLength(2);
  });

  test("searching hides the Favorites group but keeps the rest", async () => {
    useFavoriteModelsStore.setState({ favorites: [gpt5] });
    const user = userEvent.setup();
    renderOpen();

    const search = screen.getByPlaceholderText("Search models...");
    await user.type(search, "sonnet");

    expect(screen.queryByText("Favorites")).not.toBeInTheDocument();
    expect(screen.getByText("Claude Sonnet")).toBeInTheDocument();
    expect(screen.queryByText("GPT-5")).not.toBeInTheDocument();
  });

  test("clicking a model row still selects via setModel", async () => {
    const user = userEvent.setup();
    renderOpen();

    const row = getByModelName("Claude Opus");
    await user.click(row);

    expect(mocks.setModel).toHaveBeenCalledWith(
      expect.objectContaining({
        providerId: "anthropic",
        modelId: "claude-opus",
      }),
    );
  });

  test("uses a drawer on mobile and closes it after selecting a model", async () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 375,
    });
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(<ModelSelector open onOpenChange={onOpenChange} />);

    expect(
      screen.getByRole("heading", { name: "Select model" }),
    ).toBeInTheDocument();

    const modelButton = screen.getByText("Claude Opus").closest("button");
    if (!modelButton) throw new Error("Model button not found");
    await user.click(modelButton);

    expect(mocks.setModel).toHaveBeenCalledWith(
      expect.objectContaining({ modelId: "claude-opus" }),
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
