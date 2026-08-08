---
version: alpha
name: Cloudy
description: >-
  Visual identity for the Cloudy web-app — a browser-based "desktop IDE" for
  chatting, sketching on a node canvas, and browsing files. The system is a
  neutral, high-contrast grayscale with a single red destructive accent, flat
  depth (borders over shadows), and Geist Variable as the workhorse typeface.
  Light-mode tokens are canonical; dark mode is a lightness inversion defined
  in src/index.css under the .dark class.
colors:
  background: "oklch(1 0 0)"
  foreground: "oklch(0.145 0 0)"
  card: "oklch(1 0 0)"
  card-foreground: "oklch(0.145 0 0)"
  popover: "oklch(1 0 0)"
  popover-foreground: "oklch(0.145 0 0)"
  primary: "oklch(0.205 0 0)"
  primary-foreground: "oklch(0.985 0 0)"
  secondary: "oklch(0.97 0 0)"
  secondary-foreground: "oklch(0.205 0 0)"
  muted: "oklch(0.97 0 0)"
  muted-foreground: "oklch(0.556 0 0)"
  accent: "oklch(0.97 0 0)"
  accent-foreground: "oklch(0.205 0 0)"
  destructive: "oklch(0.58 0.22 27)"
  border: "oklch(0.922 0 0)"
  input: "oklch(0.922 0 0)"
  ring: "oklch(0.708 0 0)"
  chart-1: "oklch(0.809 0.105 251.813)"
  chart-2: "oklch(0.623 0.214 259.815)"
  chart-3: "oklch(0.546 0.245 262.881)"
  chart-4: "oklch(0.488 0.243 264.376)"
  chart-5: "oklch(0.424 0.199 265.638)"
  sidebar: "oklch(0.985 0 0)"
  sidebar-foreground: "oklch(0.145 0 0)"
  sidebar-primary: "oklch(0.205 0 0)"
  sidebar-primary-foreground: "oklch(0.985 0 0)"
  sidebar-accent: "oklch(0.97 0 0)"
  sidebar-accent-foreground: "oklch(0.205 0 0)"
  sidebar-border: "oklch(0.922 0 0)"
  sidebar-ring: "oklch(0.708 0 0)"
typography:
  display:
    fontFamily: "Geist Variable"
    fontSize: 48px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.02em
  h1:
    fontFamily: "Geist Variable"
    fontSize: 36px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.02em
  h2:
    fontFamily: "Geist Variable"
    fontSize: 30px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.01em
  h3:
    fontFamily: "Geist Variable"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.3
  body-lg:
    fontFamily: "Geist Variable"
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.6
  body-md:
    fontFamily: "Geist Variable"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "Geist Variable"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "Geist Variable"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1
  label-caps:
    fontFamily: "Geist Variable"
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 0.05em
  content-serif:
    fontFamily: "Maitree"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
rounded:
  sm: 6px
  md: 8px
  lg: 10px
  xl: 14px
  2xl: 18px
  3xl: 22px
  4xl: 26px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: 8px 16px
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    rounded: "{rounded.md}"
    padding: 8px 16px
  button-destructive:
    backgroundColor: "{colors.destructive}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: 8px 16px
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: 8px 16px
  button-ghost:
    backgroundColor: transparent
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: 8px 16px
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.xl}"
    padding: 24px
  input:
    backgroundColor: "{colors.input}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: 8px 12px
  dialog:
    backgroundColor: "{colors.popover}"
    textColor: "{colors.popover-foreground}"
    rounded: "{rounded.xl}"
    padding: 24px
  tooltip:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: 4px 8px
  tabs-trigger:
    backgroundColor: transparent
    textColor: "{colors.muted-foreground}"
    rounded: "{rounded.md}"
    padding: 8px 12px
  tabs-trigger-active:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
---

# Cloudy — DESIGN.md

The persistent source of truth for the Cloudy web-app's visual identity. Read
this **before** implementing any UI — tokens are normative values; the prose
explains how to apply them. Mirrors the live CSS variables in
[`src/index.css`](./src/index.css); when you change a token there, update it
here too. Validate with `pnpm --filter web-app design:lint`.

## Overview

Cloudy presents itself as a **browser-based desktop IDE** — a calm, dense,
instrument-grade surface for chatting with agents, sketching on a node canvas
(Desk), and browsing files. The personality is:

- **Instrumental, not decorative.** The UI recedes so the user's content
  (code, chat, diagrams) carries the visual weight.
- **Neutral and high-contrast.** A near-pure-white canvas (`background`) with
  near-black ink (`foreground`); color is reserved for meaning, never ornament.
- **Single chromatic accent.** One red (`destructive`) signals errors,
  deletion, and irreversible actions. Everything else is grayscale.
- **Flat depth.** Hierarchy comes from tonal contrast and 1px borders, not
  drop shadows. The interface feels printed, not layered.
- **Desktop-grade density.** Three-pane composition (tabs left, main center,
  sidebar right), compact spacing, Geist Variable's engineered geometry.

The emotional target is the quiet competence of a pro IDE or terminal — never
the softness of a marketing site.

## Colors

A **monochrome grayscale foundation** with a single semantic accent.

- **Background (`oklch(1 0 0)`)** — Pure white. The app canvas; never tinted.
- **Foreground (`oklch(0.145 0 0)`)** — Near-black ink for all primary text and
  icons.
- **Primary (`oklch(0.205 0 0)`)** — The default filled surface for buttons,
  tooltips, and active markers. Inverts with `primary-foreground` (near-white).
- **Secondary / Muted / Accent (`oklch(0.97 0 0)`)** — Three aliases for the
  same warm light gray. Used for subtle fills: secondary buttons, hover
  states, sidebar tiles, code-chip backgrounds.
- **Muted-foreground (`oklch(0.556 0 0)`)** — Mid-gray for metadata, captions,
  placeholder text, inactive tabs.
- **Destructive (`oklch(0.58 0.22 27)`)** — The only chromatic color. Reserved
  exclusively for errors, delete actions, and danger confirmations. Never use
  it for emphasis or decoration.
- **Border / Input (`oklch(0.922 0 0)`)** — Hairline gray for dividers, input
  borders, and card outlines.
- **Ring (`oklch(0.708 0 0)`)** — Focus ring color, slightly darker than
  muted-foreground.
- **Chart 1–5** — A cool blue ramp (`oklch` hue ≈ 252–266) for data
  visualization only. Not used elsewhere in the UI.
- **Sidebar-** tokens mirror the main palette at slightly lighter values so the
  left rail reads as a distinct but related surface.

### Dark mode

Light tokens above are **canonical**. Dark mode is a lightness inversion
applied by toggling the `.dark` class on `<html>` (handled by `next-themes`).
The exact dark oklch values live in `src/index.css` under `.dark { ... }` —
consult them directly when matching a dark-only state. The semantic roles
(primary = filled actions, destructive = red, muted-foreground = metadata)
are identical across themes; only the lightness flips.

## Typography

One workhorse family plus one serif accent.

- **Geist Variable** — The entire UI surface: headings, body, labels, inputs,
  buttons, code. A modern geometric-grotesque variable font with engineered,
  instrument-panel precision. Loaded via `@fontsource-variable/geist` and bound
  to `--font-sans` in `src/index.css`.
- **Maitree** — A slab serif used **only** through the `.font-content` utility
  class for long-form prose passages (e.g. rendered article content). Never
  used for UI chrome.

Typographic roles:

- **Headlines (display, h1, h2, h3)** — Geist Semi-Bold/Bold with tight
  tracking and compressed leading. Used sparingly — most screens have at most
  one heading.
- **Body (body-lg, body-md, body-sm)** — Geist Regular. `body-sm` (14px) is the
  default for dense UI text; `body-md` (16px) for chat messages and rich text;
  `body-lg` is rare, reserved for marketing-ish surfaces.
- **Labels (label, label-caps)** — Geist Medium at 14px, or Semi-Bold
  uppercased with letter-spacing for section eyebrows and tabular metadata.

## Layout

A **fixed three-pane desktop composition**, not a responsive grid:

1. **Left rail** — Tab bar (chat, desk, files, webview) + workspace picker.
   Owned by `AppNav.tsx`.
2. **Center** — The active tab's main content area (chat thread, React Flow
   canvas, file browser, embedded webview).
3. **Right sidebar** — Contextual tooling (node drawer, session settings).

Panels use `react-resizable-panels` and collapse via `sidebarStore`. The app
fills the viewport (`100dvh`); there is no page scroll — only inner regions
scroll. Spacing follows Tailwind v4's 4px base grid (`xs=4, sm=8, md=16,
lg=24, xl=32, 2xl=48`). Components prefer `gap-*` over manual margins.

## Elevation & Depth

Depth is **flat by design**. Hierarchy is conveyed through:

1. **Tonal contrast** — lighter surfaces (`secondary`/`muted`) on the
   `background`, darker ink (`foreground`) on top.
2. **1px borders** (`border` token) around cards, inputs, and dividers.
3. **Focus rings** (`ring` token, 2px) — the only non-border outline.

**Avoid drop shadows.** The few exceptions are transient overlays (toasts via
`sonner`, popovers, tooltips) where a shadow is needed to lift the element off
the canvas. Even then, prefer the shadcn default subtle shadow over anything
dramatic. Never add `shadow-*` utilities to inline content cards.

## Shapes

A **moderate, consistent corner radius** — soft enough to feel modern, tight
enough to feel engineered. The scale derives from a single base (`--radius:
0.625rem` = 10px) in `src/index.css`:

- `sm` (6px) — tags, badges, small chips
- `md` (8px) — buttons, inputs, tooltip default
- `lg` (10px) — default for most surfaces
- `xl` (14px) — cards, dialogs, popovers
- `2xl`+ (18px and up) — large feature panels, command palettes
- `full` (9999px) — pills, avatars, icon-only circular buttons, the active-tab
  indicator

**Never mix radii within a single composition** — a card and its contents
should share the same family. Pills (`rounded-full`) are reserved for
categorization chips and avatars, not primary actions.

## Components

All atoms come from **shadcn/ui** in the `base-vega` style with a `neutral`
base color (see [`components.json`](./components.json)). They consume the CSS
variable tokens above — never hard-code hex values in components.

- **Buttons** — five variants (`primary`, `secondary`, `destructive`,
  `outline`, `ghost`), one size family (`md`, 8×16px padding, `rounded-md`).
  `primary` is the default for the single most important action per surface;
  `destructive` is never used for anything but irreversible actions.
- **Card** — flat white surface, `rounded-xl`, 1px border, 24px padding. No
  shadow.
- **Input** — `input` background, `rounded-md`, 1px border that darkens to
  `ring` on focus.
- **Dialog / Popover** — `popover` surface, `rounded-xl`, border-only depth.
- **Tooltip** — `primary` background with `primary-foreground` text,
  `rounded-md`, tight 4×8px padding. Short labels only.
- **Tabs** — `tabs-trigger` is transparent with `muted-foreground` text; the
  active trigger flips to `background` + `foreground`. The Desk/Chat/Files/
  Webview tab bar at the top of the main area is the canonical example.

When adding a new component, prefer composing these atoms over introducing a
new visual primitive. If a new token is genuinely needed, add it to
`src/index.css` **and** to the YAML front matter above in the same change.

## Do's and Don'ts

- **Do** use `primary` for the single most important action per screen.
- **Do** reserve `destructive` exclusively for errors and irreversible
  actions.
- **Do** convey hierarchy with tonal contrast and 1px borders, not shadows.
- **Do** use the shared `EmptyState` / `ErrorState` / `LoadingState`
  components (see `AGENTS.md` → State components) instead of hand-rolling
  inline state JSX.
- **Do** keep color semantic — never use `chart-*` blues outside data
  visualization, never tint `background`.
- **Don't** introduce a second accent color. Grayscale + red is the system.
- **Don't** mix corner radii within a single card or panel.
- **Don't** add drop shadows to inline content — only to transient overlays.
- **Don't** hard-code hex/oklch values in components — reference the CSS
  variables (`bg-background`, `text-foreground`, `border-border`, etc.) or the
  tokens above.
- **Don't** use more than two font weights on a single screen.
- **Don't** use `Maitree` (`.font-content`) outside long-form prose — Geist
  Variable is the UI typeface.
