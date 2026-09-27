---
target: Home page
total_score: 25
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 2
target_identity: "file:/Users/luckytime1996/Documents/Work/One-man-show/Code/cloudy/apps/web-app/src/features/home/HomeContent.tsx"
target_fingerprint: "sha256:e2e3ed52e20199cc3ac2128dadd5daac9908f5c832fb54ba36ef29c78c214ab3"
target_path: /Users/luckytime1996/Documents/Work/One-man-show/Code/cloudy/apps/web-app/src/features/home/HomeContent.tsx
timestamp: 2026-09-27T15-37-34Z
slug: apps-web-app-src-features-home-homecontent-tsx
---

# Cloudy Home Critique

## Design Health Score

| #         | Heuristic                       |     Score | Key Issue                                                                                      |
| --------- | ------------------------------- | --------: | ---------------------------------------------------------------------------------------------- |
| 1         | Visibility of System Status     |       3/4 | Connection and terminal states are visible; the empty terminal block is oversized.             |
| 2         | Match System / Real World       |       3/4 | Core terms are clear, but `Recent` is ambiguous and the poetic greeting is less task-oriented. |
| 3         | User Control and Freedom        |       2/4 | Back and destructive controls are good; session rename relies on undiscoverable double-click.  |
| 4         | Consistency and Standards       |       3/4 | Shared components are consistent; creation and icon-only controls are less discoverable.       |
| 5         | Error Prevention                |       3/4 | Destructive actions confirm; nested interactions and double-click rename remain easy to miss.  |
| 6         | Recognition Rather Than Recall  |       2/4 | Reopening work is clear; creating new work requires discovering the global plus menu.          |
| 7         | Flexibility and Efficiency      |       2/4 | Recent sessions are efficient, but Home lacks a direct new-work path or visible accelerator.   |
| 8         | Aesthetic and Minimalist Design |       3/4 | Clean and disciplined, but empty terminal space and decorative greeting dilute focus.          |
| 9         | Error Recovery                  |       3/4 | Error primitives and retry paths exist, though copy is generic.                                |
| 10        | Help and Documentation          |       1/4 | The Home model and hidden interaction affordances are not explained.                           |
| **Total** |                                 | **25/40** | **Acceptable; significant improvements needed before users are happy.**                        |

## Design Specificity

The visual system is specific and coherent: flat dark surfaces, border-led hierarchy, dense Geist typography, and restrained iconography fit an instrument-grade IDE. The weak point is interaction specificity: the page behaves like a passive activity feed instead of a confident launchpad for the next task.

## What's Working

- Recent session rows are the strongest pattern: title, directory, workspace, and recency support fast recognition and reopening.
- Workspace detail has a good drill-down model with explicit Back, contextual new chat, and grouped destructive actions.
- Shared loading, empty, and error states keep the page technically cohesive.

## Priority Issues

### P1: Make the next action explicit

The Home surface has no visually explicit primary action. Add a clear `New chat` or `Start working` action near the greeting, with Desk/Files/Terminal as secondary actions. Keep the global plus as an accelerator, not the only discovery path.

### P1: Reorder around user intent

Move Recent sessions and Workspaces before Open terminals. Hide or compress the empty terminal section; keep it prominent only when terminals are active. The current order makes infrastructure state interrupt the return-to-work flow.

### P2: Clarify grouping and labels

Rename `Recent` to `Recent desks`. Consider section names such as `Continue working` and `Your workspaces` so the page communicates a clear choice: continue or start.

### P2: Reduce raw path dominance

Show workspace name plus a compact directory basename in session rows. Reveal the full path on hover, detail, or a tooltip. This will improve scanability on both desktop and mobile without losing information.

### P2: Align tone with the visual system

Replace lifestyle copy such as `Burning the midnight oil` and the waving emoji with concise operational language. Decide whether blue workspace dots are intentional product semantics; they currently conflict with the documented grayscale-plus-red system.

## Persona Red Flags

- **Jordan, first-timer:** The first action is unclear; icon-only controls and hidden creation paths force guessing.
- **Alex, power user:** Reopening sessions is fast, but starting a new task has no obvious keyboard or direct path and raw paths add scanning cost.
- **Casey, mobile user:** Full filesystem paths and a top-level plus action make the primary action harder to find in a small viewport.

## Minor Observations

- Detector reported 8 advisory font-size findings; they are intentional microcopy/metadata sizes, not urgent visual defects.
- Live browser showed no horizontal overflow at 390px.
- Live browser showed an unrelated WebSocket warning and two 404s; Home itself rendered successfully.

## Questions to Consider

- Should Home optimize first for `Continue working` or `Start something new`?
- Are terminals a core daily workflow or an advanced utility that should stay quiet when empty?
- Is the grayscale-plus-red system still the intended visual rule, or should workspace color become a documented semantic exception?
