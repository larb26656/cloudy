---
title: Build Cloudy Astro landing page
slug: build-cloudy-astro-landing-page
id: 20260809-build-cloudy-astro-landing-page
status: ready
created: 2026-08-09
source: planning session 2026-08-09
---

# Plan: Build Cloudy Astro landing page

## Why

Cloudy needs a public landing page that presents it as an open-source multitasking
workspace around coding agents, rather than marketing capabilities inherited from
OpenCode. The page should make Cloudy's own value immediately clear through three
pillars—Multitasking, Desk, and responsive use across desktop, iPad/tablet, and mobile—then
invite visitors to use and help develop the project.

## Target file

| Path                                 | Action |
| ------------------------------------ | ------ |
| `apps/website/src/pages/index.astro` | create |
| `apps/website/src/styles/global.css` | create |

## Context the new session needs

- This is the landing page for a new Astro project at `apps/website`. The project will
  later host setup guides and other documentation, but documentation architecture and
  content are explicitly out of scope for this plan. If the Astro shell does not exist
  yet, scaffold it first as a separate prerequisite and keep this plan's implementation
  focused on the two target files.
- Do not replace the existing application route. `apps/web-app/src/routes/index.tsx:1-6`
  is the signed-in product home/workspace surface, not the public marketing website.
- Position Cloudy as **the open-source workspace around a coding agent**. Do not present
  model intelligence, tool execution, reasoning, file mentions, or other OpenCode
  capabilities as features invented by Cloudy.
- The three product pillars and their intended messages are:
  1. **Multitasking** — keep multiple tasks, sessions, projects, and tools in motion;
     preserve each task's place and reduce context switching.
  2. **Desk** — explain the product term directly: "A Desk is a persistent canvas where
     your tools, context, and ideas stay together." Show that users can arrange and resize
     sessions, terminals, webviews, Mermaid diagrams, sticky notes, text, and todos around
     a task. The current Desk tab is registered at
     `apps/web-app/src/features/home/tabs/implementations/desk/meta.ts:14-25`; real node
     types are defined under
     `apps/web-app/src/features/desk/nodes/implementations/*/meta.ts`.
  3. **Responsive workspace** — Cloudy is intentionally comfortable at desktop, iPad or
     tablet, and mobile widths. Describe it as adapting navigation, panels, and controls
     to the available space, not as a desktop layout merely scaled down.
- Recommended hero copy:
  - eyebrow: `Open-source multitasking workspace for coding agents`
  - headline: `Everything in motion. Everything in its place.`
  - supporting copy: `Manage multiple tasks, arrange your tools on persistent Desks, and
keep working comfortably across desktop, tablet, and mobile.`
  - primary CTA: `View on GitHub`
  - secondary CTA: `Explore Cloudy`
- Recommended feature copy:
  - Multitasking heading: `Keep every task in motion`
  - Multitasking summary: `Work across multiple tasks without losing your place.`
  - Desk heading: `Build a Desk around your work`
  - Desk summary: `A visual workspace shaped around the task.`
  - Responsive heading: `One workspace. Every screen.`
  - Responsive summary: `Designed for desktop, tablet, and mobile—not merely resized for
them.`
- The page narrative should move through four beats: **many tasks are already in motion →
  Cloudy keeps them organized → Desk lets the user shape the workspace → the project is
  open for the community to shape too**. Keep the story focused on workflow and
  convenience rather than explaining agent internals.

### Landing page content brief

Use the following section order and copy as the baseline. Small edits for rhythm and
layout are allowed, but preserve the positioning and meaning.

#### 1. Navigation

- Brand: `Cloudy`
- Anchor links: `Features`, `Desk`, `Responsive`
- Product links: `Docs`, `GitHub`
- Primary navigation CTA: `View on GitHub`
- Keep the navigation compact. On mobile, collapse nonessential links without hiding the
  GitHub CTA or making the docs entry unreachable.

#### 2. Hero — establish the category

- Eyebrow: `Open-source multitasking workspace for coding agents`
- Headline: `Everything in motion. Everything in its place.`
- Body: `Manage multiple tasks, arrange your tools on persistent Desks, and keep working
comfortably across desktop, tablet, and mobile.`
- Primary CTA: `View on GitHub`
- Secondary CTA: `Explore Cloudy`
- Supporting line: `Multitask. Arrange. Anywhere.`
- The hero visual should communicate several active tasks without feeling chaotic. Show a
  recognizable Cloudy workspace with multiple tabs and a Desk rather than a generic chat
  conversation or an abstract AI illustration.

#### 3. Multitasking — the primary product benefit

- Eyebrow: `Multitasking`
- Heading: `Keep every task in motion.`
- Body: `Work across multiple sessions, projects, and tools without forcing everything
into one place. Each task keeps its own tab and working context, so you can switch focus
and continue exactly where you stopped.`
- Supporting points:
  - `Keep multiple tasks open at once.`
  - `Move between projects without mixing their context.`
  - `Return to recent sessions and Desks without rebuilding your setup.`
  - `Reorder tabs around what matters now.`
- Short caption: `Your agents can work in parallel. Now you can too.`
- The visual should show multiple tabs tied to different kinds of work or projects. The
  benefit is continuity while switching, not the number of chat messages an agent can
  generate.

#### 4. Desk — define Cloudy's signature concept

- Eyebrow: `Desk`
- Heading: `Build a Desk around your work.`
- Definition: `A Desk is a persistent canvas where your tools, context, and ideas stay
together.`
- Body: `Bring sessions, terminals, webviews, diagrams, notes, and todos into one visual
workspace. Arrange and resize each piece to create a setup for coding, debugging,
research, planning, or whatever the task needs.`
- Supporting points:
  - `Arrange tools freely on a visual canvas.`
  - `Resize each node around the information it contains.`
  - `Combine Chat, Terminal, Webview, Mermaid, Text, Sticky Note, and Todo nodes.`
  - `Return to the same layout and continue from where you left it.`
- Short caption: `A visual workspace shaped around the task.`
- Suggested visual scenario: a feature-development Desk containing one session node, one
  terminal running the project, one webview preview, a Mermaid diagram, and a todo list.
  The visual must make the relationship between these nodes understandable at a glance.

#### 5. Responsive workspace — demonstrate intentional adaptation

- Eyebrow: `Responsive by design`
- Heading: `One workspace. Every screen.`
- Body: `Cloudy adapts its navigation, panels, and controls to the space available. It is
designed for focused desktop work, touch-friendly use on iPad and tablets, and quick
access from mobile.`
- Supporting points:
  - `A full multitasking workspace on desktop.`
  - `Touch-friendly navigation and controls on tablet.`
  - `Focused, accessible views for mobile.`
  - `Comfortable in portrait and landscape layouts.`
- Short caption: `Designed for desktop, tablet, and mobile—not merely resized for them.`
- Avoid claiming an identical interface on all devices. Show the same task represented
  across desktop, tablet, and mobile with layouts that adapt their hierarchy and controls.
  A three-device composition or a responsive transformation sequence is preferred over
  three unrelated screenshots.

#### 6. Open-source invitation — close on participation

- Eyebrow: `Open source`
- Heading: `Let's build the workspace we want to use.`
- Body: `Cloudy is an open-source project built around a simple idea: working with coding
agents should feel organized, flexible, and comfortable on every screen.`
- Follow-up: `Cloudy is still taking shape—and you can help shape it. Use it, explore the
code, share your ideas, or help build what comes next.`
- Primary CTA: `Build Cloudy With Us`
- Secondary CTA: `Explore the Code`
- Supporting line: `Open source. Built in public. Shaped by its community.`
- Optional final hook: `If this is the kind of tool you want to exist, come build it with
us.`
- Link the primary CTA to the real contribution entry point when one exists. Until then,
  link both CTAs to appropriate real GitHub destinations rather than creating a dead
  contribution route.

#### 7. Footer

- Include the Cloudy name, a one-line description, repository link, documentation link,
  license link, and contribution link when their real destinations exist.
- Suggested description: `An open-source multitasking workspace for coding agents.`
- Do not add newsletter signup, pricing, testimonials, customer logos, or enterprise
  claims; none are part of the current project positioning.

### Voice and terminology

- Write in concise, confident English. Prefer concrete workflow language such as `tasks`,
  `projects`, `tabs`, `Desk`, `tools`, `context`, and `workspace`.
- Always capitalize `Desk` when referring to the Cloudy product concept. Use lowercase
  only for an ordinary physical desk.
- Use `coding agents` to describe the category and `OpenCode` only where integration or
  attribution is actually necessary. Do not make OpenCode the headline or the protagonist
  of the page.
- Do not call Cloudy an IDE replacement, autonomous development platform, or AI model.
- Do not promise productivity gains with invented numbers or use unsupported claims such
  as `100% private`, `fully local`, `works offline`, or `the fastest`.
- The intended feeling is capable, calm, and inviting: a focused tool built by people who
  use it, with enough openness that visitors feel welcome to participate.
- Use the existing product identity as the baseline. `apps/web-app/DESIGN.md:178-196`
  defines Cloudy as instrumental, neutral, high-contrast, grayscale, flat, and
  desktop-grade. `apps/web-app/DESIGN.md:233-254` defines Geist Variable and the type
  hierarchy. Preserve that recognizable identity while giving the public page enough
  spacing and narrative rhythm to work as marketing.
- Avoid decorative gradients, excessive floating cards, generic AI imagery, and invented
  product screenshots. Prefer a real product screenshot or a faithful product UI
  composition that demonstrates simultaneous tabs, a Desk, and the three target viewport
  sizes.
- Use semantic HTML, visible keyboard focus, descriptive link labels, and reduced-motion
  fallbacks. The page should render useful content without client-side JavaScript.

## Tasks

- [ ] 1. **Create the landing-page content structure with navigation, hero, the three product pillars, an open-source closing CTA, and a minimal footer.**
  - verify: `rg -n "Everything in motion|Keep every task in motion|Build a Desk around your work|One workspace. Every screen|Let's build the workspace" apps/website/src/pages/index.astro`
  - files: `apps/website/src/pages/index.astro`
- [ ] 2. **Add product-focused visuals that demonstrate parallel work, explain a Desk with real supported node types, and show desktop/tablet/mobile adaptation without attributing OpenCode features to Cloudy.**
  - verify: `rg -n "Multitasking|Desk|Terminal|Webview|Mermaid|Sticky|Todo|desktop|tablet|mobile" apps/website/src/pages/index.astro`
  - files: `apps/website/src/pages/index.astro`
- [ ] 3. **Implement the Cloudy visual system and responsive layouts with mobile-first CSS, explicit tablet and desktop breakpoints, accessible focus states, and reduced-motion handling.**
  - verify: `rg -n "@media|prefers-reduced-motion|:focus-visible|--background|--foreground" apps/website/src/styles/global.css`
  - files: `apps/website/src/styles/global.css`
- [ ] 4. **Wire the global stylesheet and complete real GitHub, documentation, and project CTAs without adding documentation pages in this plan.**
  - verify: `pnpm --filter website build && rg -n "global.css|github|docs" apps/website/src/pages/index.astro`
  - files: `apps/website/src/pages/index.astro`, `apps/website/src/styles/global.css`
- [ ] 5. **Review the rendered page at mobile, tablet, and desktop widths and correct overflow, unreadable text, undersized touch targets, and layout-dependent content loss.**
  - verify: `pnpm --filter website build` and manually inspect at approximately `390x844`, `834x1194`, and `1440x900`
  - files: `apps/website/src/pages/index.astro`, `apps/website/src/styles/global.css`

## Done when

- [ ] `pnpm --filter website build` exits successfully and the page works without
      client-side JavaScript.
- [ ] The rendered page communicates Multitasking, defines Desk, and demonstrates
      desktop/tablet/mobile support without marketing wrapped OpenCode capabilities as
      Cloudy-owned features.
- [ ] The final section clearly presents Cloudy as open source and links visitors to the
      real repository and contribution path.
- [ ] At `390px`, `834px`, and `1440px` viewport widths there is no horizontal overflow,
      clipped CTA, inaccessible navigation, or missing core content.

## Notes for implementer

- Read the root `AGENTS.md` before editing and check for a new nested
  `apps/website/AGENTS.md` after the Astro project is scaffolded.
- Replace any placeholder repository or documentation URL with the real project URL
  before marking the plan complete; do not invent URLs.
- Keep this plan limited to the landing page. Documentation navigation, content
  collections, search, setup guides, and versioned docs should be planned separately.
- Do not commit unless explicitly asked. Run the repository lint and typecheck commands
  in addition to the Astro build if the new website package participates in those tasks.
