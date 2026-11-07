# 01: Preserve Generic Tool Activity through its lifecycle

**What to build:** ACP tool actions that cannot yet be classified remain useful Generic Tool Activity through Cloudy's public message contract. Users retain the supplied action details, progress, results, and failure information without invented identity or missing data. This is complete fallback behavior, not scaffolding for later native mappings. Apply it in the reusable ACP adapter for every ACP provider.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [x] Unrecognized, ambiguous, title-only, and partially described calls retain available input, output, title, kind, locations, and provider details without claiming an unsupported native category. A title, broad kind, or name substring alone does not establish identity.
- [x] Initial calls and subsequent updates enrich one activity per session and call ID. Later explicit names and inputs are accepted without creating another activity; known mappings outside this ticket are not regressed.
- [x] Update-before-call, interleaved calls, delayed updates to an earlier turn, and identical call IDs in separate sessions retain the correct ownership without mixing data or moving activity into the latest turn.
- [x] Pending, running, completed, and failed states preserve their supplied meaning. Top-level fields and richer state agree when both exist; supplied failure details survive. Missing statuses, errors, timestamps, and completion are not fabricated.
- [x] Omitted fields retain prior knowledge where ACP specifies it. Explicit clears, empty values, and replacement collections follow protocol semantics and do not leave obsolete results behind.
- [x] Structured output and supplied display content retain distinct useful information. Native result fields do not require consumers to unwrap ACP content envelopes, and a terminal reference is retained without being invented into command text or output.
- [x] Original provider identity and relevant payload details remain separate from normalized fields and available for the existing raw disclosure. Do not add a raw-event archive, logging pipeline, persistence, or a new disclosure UI.
- [x] Equivalent live and load/replay traces produce equivalent normalized semantics for the information supplied. Do not require unavailable replay information or undocumented cross-reload ID stability.
- [x] Extend the existing real-adapter ACP fixture harness at the public live ChatEvent and history ChatMessage seam. Assert exact useful data, lifecycle transitions, replacement behavior, and ownership, including intermediate states; do not merely assert existence or list size.
- [x] Run targeted adapter contract scenarios as behavioral smoke, relevant existing tests, and required lint/type checks. No new browser, component, or visual tests are required. Preserve existing non-tool conversation behavior and other providers' canonical behavior.

## Scope and handoff

The parent spec in this feature directory is authoritative. This ticket establishes truthful generic normalization and lifecycle semantics used by tickets 02–04. It does not introduce speculative provider aliases, execute tools, modify Interaction workflows, or require OMP-specific behavior. Native conversions in later tickets must reuse these semantics rather than create parallel pipelines.
