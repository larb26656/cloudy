import { beforeEach, describe, expect, it } from "vitest";
import { useFavoriteModelsStore } from "./favoriteModelsStore";
import type { ModelInfo } from "@repo/contracts";

const gpt: ModelInfo = {
  providerId: "openai",
  modelId: "gpt-5",
  name: "GPT-5",
};

const sonnet: ModelInfo = {
  providerId: "anthropic",
  modelId: "claude-sonnet",
  name: "Claude Sonnet",
};

const opus: ModelInfo = {
  providerId: "anthropic",
  modelId: "claude-opus",
  name: "Claude Opus",
};

describe("favoriteModelsStore", () => {
  beforeEach(() => {
    useFavoriteModelsStore.setState({ favorites: [] });
  });

  it("starts empty", () => {
    expect(useFavoriteModelsStore.getState().favorites).toEqual([]);
    expect(
      useFavoriteModelsStore.getState().isFavorite("openai", "gpt-5"),
    ).toBe(false);
  });

  it("toggleFavorite adds a model and isFavorite returns true", () => {
    useFavoriteModelsStore.getState().toggleFavorite(gpt);

    expect(useFavoriteModelsStore.getState().favorites).toEqual([gpt]);
    expect(
      useFavoriteModelsStore.getState().isFavorite("openai", "gpt-5"),
    ).toBe(true);
  });

  it("toggleFavorite moves an existing model to the front (LIFO)", () => {
    const { toggleFavorite } = useFavoriteModelsStore.getState();
    toggleFavorite(gpt);
    toggleFavorite(sonnet);
    toggleFavorite(opus);

    expect(useFavoriteModelsStore.getState().favorites).toEqual([
      opus,
      sonnet,
      gpt,
    ]);
  });

  it("toggleFavorite on an existing model removes it", () => {
    const { toggleFavorite } = useFavoriteModelsStore.getState();
    toggleFavorite(gpt);
    toggleFavorite(sonnet);
    toggleFavorite(gpt);

    expect(useFavoriteModelsStore.getState().favorites).toEqual([sonnet]);
    expect(
      useFavoriteModelsStore.getState().isFavorite("openai", "gpt-5"),
    ).toBe(false);
  });

  it("toggleFavorite uses the latest ModelInfo payload on re-add", () => {
    const { toggleFavorite } = useFavoriteModelsStore.getState();
    toggleFavorite(gpt);

    const updated: ModelInfo = { ...gpt, description: "newer description" };
    toggleFavorite(updated);
    toggleFavorite(updated);

    expect(useFavoriteModelsStore.getState().favorites).toEqual([updated]);
    expect(useFavoriteModelsStore.getState().favorites[0]?.description).toBe(
      "newer description",
    );
  });

  it("removeFavorite removes by providerId+modelId only", () => {
    const { toggleFavorite, removeFavorite } =
      useFavoriteModelsStore.getState();
    toggleFavorite(gpt);
    toggleFavorite(sonnet);
    toggleFavorite(opus);

    removeFavorite("anthropic", "claude-sonnet");

    const remaining = useFavoriteModelsStore.getState().favorites;
    expect(remaining).toHaveLength(2);
    expect(remaining).toEqual([opus, gpt]);
  });

  it("removeFavorite is a no-op when target is not present", () => {
    const { toggleFavorite, removeFavorite } =
      useFavoriteModelsStore.getState();
    toggleFavorite(gpt);

    removeFavorite("anthropic", "claude-sonnet");

    expect(useFavoriteModelsStore.getState().favorites).toEqual([gpt]);
  });

  it("isFavorite differentiates by providerId", () => {
    const { toggleFavorite, isFavorite } = useFavoriteModelsStore.getState();
    const localCopy: ModelInfo = { ...gpt, providerId: "local" };
    toggleFavorite(localCopy);

    expect(isFavorite("local", "gpt-5")).toBe(true);
    expect(isFavorite("openai", "gpt-5")).toBe(false);
  });
});
