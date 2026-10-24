export type AgentAvatarLayerLayout = {
  x: number;
  y: number;
  scale: number;
  rotate: number;
};

export const agentAvatarHeadwearLayouts = {
  none: { x: 0, y: 0, scale: 1, rotate: 0 },
  sprout: { x: 0, y: -3, scale: 1, rotate: 0 },
  halo: { x: 0, y: -2, scale: 1, rotate: 0 },
} as const satisfies Record<string, AgentAvatarLayerLayout>;

export const agentAvatarFacewearLayouts = {
  none: { x: 0, y: 0, scale: 1, rotate: 0 },
  "round-glasses": { x: 0, y: 0, scale: 1, rotate: 0 },
  sunglasses: { x: 0, y: 0, scale: 1, rotate: 0 },
} as const satisfies Record<string, AgentAvatarLayerLayout>;

export const agentAvatarFaceDecorationLayouts = {
  none: { x: 0, y: 0, scale: 1, rotate: 0 },
  blush: { x: 0, y: 0, scale: 1, rotate: 0 },
  freckles: { x: 0, y: 0, scale: 1, rotate: 0 },
} as const satisfies Record<string, AgentAvatarLayerLayout>;

export const agentAvatarAmbientLayouts = {
  none: { x: 0, y: 0, scale: 1, rotate: 0 },
  sparkles: { x: 0, y: 0, scale: 1, rotate: 0 },
} as const satisfies Record<string, AgentAvatarLayerLayout>;
