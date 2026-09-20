import type { StateStorage } from "zustand/middleware";

const legacyState = {
  "extension-selected-model": (value: unknown) => ({ model: value }),
  "latest-session-id": (value: unknown) => ({ sessionId: value }),
  "extension-favorite-models": (value: unknown) => ({ favorites: value }),
} as const;

function serializeLegacyState(name: string, value: unknown) {
  const createState = legacyState[name as keyof typeof legacyState];
  return JSON.stringify({
    state: createState ? createState(value) : value,
    version: 0,
  });
}

export const extensionStorage: StateStorage = {
  getItem: async (name) => {
    const stored = await browser.storage.local.get(name);
    const value = stored[name];

    if (value === undefined || value === null) return null;

    if (typeof value === "string") {
      try {
        const parsed: unknown = JSON.parse(value);
        if (
          parsed &&
          typeof parsed === "object" &&
          "state" in parsed &&
          "version" in parsed
        ) {
          return value;
        }
      } catch {}
    }

    return serializeLegacyState(name, value);
  },
  setItem: async (name, value) => {
    await browser.storage.local.set({ [name]: value });
  },
  removeItem: async (name) => {
    await browser.storage.local.remove(name);
  },
};
