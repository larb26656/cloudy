import type { ChatEvent } from "@repo/opencode";
import { subscribeToProviderEvents } from "../cloudy/provider";

export async function subscribeToEvents(
  directory: string,
  onEvent: (event: ChatEvent) => void,
  signal: AbortSignal,
): Promise<void> {
  return subscribeToProviderEvents(directory, onEvent, signal);
}
