# 04: Normalize remaining established native tool categories

**What to build:** Users receive consistent Native Tool Activity for ACP file reads, local searches, web tools, task activity, question-tool displays, and todo/plan activity when their identities and payload semantics are established. Unsupported shapes remain useful Generic Tool Activity rather than receiving misleading native labels.

**Blocked by:** 01 — Preserve Generic Tool Activity through its lifecycle.

**Status:** resolved

- [x] Established read calls expose the native file path and supplied range parameters without inventing offsets or limits.
- [x] Established grep and glob calls expose the native pattern, path, and supported optional parameters as supplied.
- [x] Established web-fetch and web-search calls expose the native URL or query and supplied supported options, without guessing tool identity from text or URLs alone.
- [x] Established task calls retain the native agent, description, prompt, and supplied task-session linkage where supported. Do not fabricate a session link or launch a task on behalf of the agent.
- [x] Established question-tool payloads retain their native display data without creating, answering, or changing a Question or Permission Interaction.
- [x] Existing ACP plan-to-todo behavior remains available through the shared native contract, and established todo calls retain their supplied entries and states without inventing priority, completion, or user answers.
- [x] For each supported category, conversion uses established semantics and native parameter shapes. Authoritative evidence or sanitized real traces establish provider-specific variants; synthetic fixtures are not evidence of real OMP payloads.
- [x] Missing, ambiguous, and unsupported category data use ticket 01's Generic Tool Activity behavior without speculative name aliases or loss of available details and raw metadata.
- [x] Late identity, partial parameters, output, status, and failures reuse the same normalization lifecycle and original call ownership. Equivalent live and replay data produce equivalent native semantics.
- [x] Extend the deterministic real-adapter fixture harness to cover each category listed above, its meaningful supplied parameters, and representative ambiguous/partial cases. Verify the public live ChatEvent and history ChatMessage contract rather than registry lookup, component markup, or source text.
- [x] Update any affected incidental or pass-through assertions rather than preserving behavior that contradicts the parent spec. Preserve non-tool conversation behavior and existing canonical behavior from other providers.
- [x] Run targeted adapter contract scenarios as behavioral smoke, relevant existing tests, and required lint/type checks. Do not add a UI test suite or change command discovery, model selection, provider launch, or Interaction handling.

## Scope and handoff

The parent spec in this feature directory is authoritative. Skill/command behavior belongs to ticket 02; write/edit/patch behavior belongs to ticket 03. This ticket does not depend on either once ticket 01 is complete. Reuse existing native contracts and avoid a second provider-specific normalization pipeline.
