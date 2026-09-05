import { beforeEach, describe, expect, it } from "vitest";
import { useFavoriteModelsStore } from "./favoriteModelsStore";
import type { ModelConfig } from "@/types";

const gpt: ModelConfig = {
  providerID: "openai",
  modelID: "gpt-5",
  name: "GPT-5",
  supportsStreaming: true,
  supportsTools: true,
};

const sonnet: ModelConfig = {
  providerID: "anthropic",
  modelID: "claude-sonnet",
  name: "Claude Sonnet",
  supportsStreaming: true,
  supportsTools: true,
};

const opus: ModelConfig = {
  providerID: "anthropic",
  modelID: "claude-opus",
  name: "Claude Opus",
  supportsStreaming: true,
  supportsTools: true,
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

  it("toggleFavorite uses the latest ModelConfig payload on re-add", () => {
    const { toggleFavorite } = useFavoriteModelsStore.getState();
    toggleFavorite(gpt);

    const updated: ModelConfig = { ...gpt, description: "newer description" };
    toggleFavorite(updated);
    toggleFavorite(updated);

    expect(useFavoriteModelsStore.getState().favorites).toEqual([updated]);
    expect(useFavoriteModelsStore.getState().favorites[0]?.description).toBe(
      "newer description",
    );
  });

  it("removeFavorite removes by providerID+modelID only", () => {
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

  it("isFavorite differentiates by providerID", () => {
    const { toggleFavorite, isFavorite } = useFavoriteModelsStore.getState();
    const localCopy: ModelConfig = { ...gpt, providerID: "local" };
    toggleFavorite(localCopy);

    expect(isFavorite("local", "gpt-5")).toBe(true);
    expect(isFavorite("openai", "gpt-5")).toBe(false);
  });
});
