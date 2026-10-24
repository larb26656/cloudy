# Agent avatar SVG assets

Every file uses a `128 × 128` viewBox and is centered on the same origin, so a
shape, eyes, and an accessory can be stacked without per-asset positioning.

```
shapes/<shape>.svg             base layer; set --agent-avatar-color when inlining
eyes/<eyes>.svg                white face layer
headwear/<name>.svg            one item worn on or around the head
facewear/<name>.svg            one item worn across the eyes or face
face-decoration/<name>.svg     one decorative face detail
ambient/<name>.svg             one surrounding visual effect
layers.ts                       placement metadata for every layer
```

The React `AgentAvatar` component uses the same option IDs. Keep an asset ID
and its component option together when adding a new choice. Set its `x`, `y`,
`scale`, and `rotate` in `layers.ts` instead of baking placement into the SVG
artwork.
