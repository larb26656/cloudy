import { randomInt } from "node:crypto";

export const workspaceAdjectives = [
  "amber",
  "brisk",
  "calm",
  "clever",
  "cosmic",
  "crimson",
  "dusty",
  "eager",
  "fluent",
  "gentle",
  "golden",
  "hidden",
  "jolly",
  "lucky",
  "mellow",
  "nimble",
  "quiet",
  "rustic",
  "silver",
  "swift",
  "tranquil",
  "velvet",
  "witty",
  "zesty",
];

export const workspaceNouns = [
  "atoll",
  "beacon",
  "canyon",
  "comet",
  "delta",
  "ember",
  "falcon",
  "glacier",
  "harbor",
  "island",
  "jasper",
  "lagoon",
  "meadow",
  "nebula",
  "orbit",
  "prairie",
  "quarry",
  "ridge",
  "summit",
  "thicket",
  "umbra",
  "willow",
  "yarrow",
  "zephyr",
];

/**
 * Random workspace name: `<adjective>-<noun>-<timestamp>`, e.g.
 * `swift-comet-lyz8x0`. The base-36 millisecond timestamp keeps names from
 * colliding across successive calls.
 */
export function randomWorkspaceName(now: Date = new Date()): string {
  const adjective = workspaceAdjectives[randomInt(workspaceAdjectives.length)]!;
  const noun = workspaceNouns[randomInt(workspaceNouns.length)]!;
  return `${adjective}-${noun}-${now.getTime().toString(36)}`;
}
