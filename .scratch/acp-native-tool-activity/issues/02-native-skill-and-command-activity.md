# 02: Normalize skill and command calls into Native Tool Activity

**What to build:** Users receive recognizable skill and command actions from ACP agents through Cloudy's native tool contract. A skill exposes its supplied name; a command exposes its supplied command and available results, with the same lifecycle and fallback semantics as other activity. Implement this in the shared ACP normalization path, not an OMP-only branch.

**Blocked by:** 01 — Preserve Generic Tool Activity through its lifecycle.

**Status:** resolved

- [x] Calls with established skill identity and input semantics produce the existing native skill name and native skill-name parameter, including identity or parameters supplied in later updates.
- [x] Calls with established command identity and input semantics produce the existing native command tool name and command parameter. Preserve supplied structured results, human-readable output, and failure details through updates.
- [x] Establish each converted payload shape using authoritative protocol/provider implementation evidence or a sanitized real trace. Protocol-valid synthetic fixtures are acceptable tests but must not be represented as captured OMP behavior.
- [x] Familiar titles, broad execute kinds, or arbitrary aliases alone do not establish command or skill identity. Missing skill names and command strings remain missing; unsupported or ambiguous shapes retain useful Generic Tool Activity without fabricated details.
- [x] Terminal-reference-only content is retained as supplied reference data, not treated as command text or retrieved output. This ticket does not add terminal execution or external output retrieval.
- [x] A call that becomes recognizable after a late update enriches its original activity without duplication. Concurrent calls retain their own parameters, output, errors, and ownership.
- [x] Original provider identity and payload details remain available separately from native fields. Raw ACP envelopes are not substituted for normalized skill parameters, command text, or human-readable results.
- [x] Equivalent skill and command traces normalize consistently through live ChatEvent output and load/replay ChatMessage output, including partial data and terminal success/failure states.
- [x] Add deterministic real-adapter contract scenarios for skill, command, late identity, ambiguous fallback, absent parameters, output/display-content coexistence, terminal references, and failed execution. Assert exact semantics rather than renderer implementation or wiring.
- [x] Run targeted adapter contract scenarios as behavioral smoke, relevant existing tests, and required lint/type checks. Do not add UI tests, change Question/Permission behavior, or modify the Command Catalog.

## Scope and handoff

The parent spec in this feature directory is authoritative. Reuse ticket 01's generic activity, lifecycle, and output semantics. This ticket is independent of tickets 03 and 04 once ticket 01 is complete. Preserve current shared native consumers; any necessary narrowly scoped consumer adjustment must not introduce ACP-specific interpretation or redesign the UI.
