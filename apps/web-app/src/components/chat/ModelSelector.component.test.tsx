import { describe, expect, test, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ModelSelector } from "./ModelSelector";
import { useFavoriteModelsStore } from "@/stores/favoriteModelsStore";
import { useDefaultModelStore } from "@/stores/defaultModelStore";
import { useSessionAgentModelStore } from "@/stores/sessionAgentModelStore";
import type { ModelConfig, ModelProvider } from "@/types";

const fixtures: ModelProvider[] = [
  {
    id: "openai",
    name: "OpenAI",
    models: [
      {
        providerID: "openai",
        modelID: "gpt-5",
        name: "GPT-5",
        description: "flagship",
        supportsStreaming: true,
        supportsTools: true,
      },
      {
        providerID: "openai",
        modelID: "gpt-5-mini",
        name: "GPT-5 mini",
        description: "fast",
        supportsStreaming: true,
        supportsTools: false,
      },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    models: [
      {
        providerID: "anthropic",
        modelID: "claude-sonnet",
        name: "Claude Sonnet",
        description: "balanced",
        supportsStreaming: true,
        supportsTools: true,
      },
      {
        providerID: "anthropic",
        modelID: "claude-opus",
        name: "Claude Opus",
        description: "deep",
        supportsStreaming: true,
        supportsTools: true,
      },
    ],
  },
];

const gpt5: ModelConfig = {
  providerID: "openai",
  modelID: "gpt-5",
  name: "GPT-5",
  description: "flagship",
  supportsStreaming: true,
  supportsTools: true,
};

const sonnet: ModelConfig = {
  providerID: "anthropic",
  modelID: "claude-sonnet",
  name: "Claude Sonnet",
  description: "balanced",
  supportsStreaming: true,
  supportsTools: true,
};

vi.mock("@/hooks/queries/useModels", () => ({
  useModels: () => ({ data: fixtures, isLoading: false, error: null }),
}));

const mocks = vi.hoisted(() => ({
  setModel: vi.fn(),
  effectiveModel: null as ModelConfig | null,
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
    mocks.effectiveModel = null;
    useFavoriteModelsStore.setState({ favorites: [] });
    useDefaultModelStore.setState({ defaultModel: null });
    useSessionAgentModelStore.setState({ sessions: {} });
  });

  test("renders all provider groups when no favorites are set", () => {
    renderOpen();

    expect(screen.queryByText("Favorites")).not.toBeInTheDocument();
    expect(screen.getByText("OpenAI")).toBeInTheDocument();
    expect(screen.getByText("Anthropic")).toBeInTheDocument();
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
    const stale: ModelConfig = {
      providerID: "openai",
      modelID: "gpt-99-deleted",
      name: "GPT-99 (gone)",
      supportsStreaming: true,
      supportsTools: true,
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
        providerID: "anthropic",
        modelID: "claude-opus",
      }),
    );
  });
});
