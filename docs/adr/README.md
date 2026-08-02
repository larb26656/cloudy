# Architecture Decision Records

Chronological log of significant project decisions. Each ADR is a short
markdown file explaining _why_ a choice was made — not how to use it, and not
how to implement it.

## When to write an ADR

A decision is ADR-worthy when all of these are true:

1. A genuine choice existed — at least one realistic alternative was on the table.
2. The choice is load-bearing — reversing it later would be costly or annoying.
3. A future reader would plausibly ask "why this way?".

If you're a contributor (human or AI) and you've just made such a decision,
ask Claude to record it:

> สร้าง ADR สำหรับการเปลี่ยน X เป็น Y
> record this decision as an ADR
> /adr

The skill that drafts ADRs lives at `.agents/skills/adr/`. It will guide you
through context, decision, consequences, and alternatives, and pick the next
sequence number automatically.

## Index

| ID   | Title                                                                                                                           | Status   | Date       |
| ---- | ------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------- |
| 0003 | [Make ChatProvider own chat actions](0003-make-chatprovider-own-chat-actions.md)                                                | Accepted | 2026-08-03 |
| 0002 | [Use ChatProvider context for per-session agent/model selection](0002-per-session-agent-model-via-chat-provider.md)             | Accepted | 2026-08-02 |
| 0001 | [Adopt 3-tier layered architecture with DI for @repo/server](0001-adopt-3-tier-layered-architecture-with-di-for-repo-server.md) | Accepted | 2026-08-02 |

<!-- New rows go on top of the table (highest ID first) so the latest decisions are     -->
<!-- visible without scrolling.                                                         -->
