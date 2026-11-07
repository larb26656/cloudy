# 03: Normalize file writes and edits with owned, nonduplicated changes

**What to build:** Users receive Native Tool Activity for established ACP write, edit, and patch actions, with available file paths, contents, and changes. A multi-file action remains one logical tool activity containing every supplied change; corrections replace obsolete changes rather than adding duplicate standalone diffs.

**Blocked by:** 01 — Preserve Generic Tool Activity through its lifecycle.

**Status:** resolved

- [x] Established write payloads normalize to the existing native file-path and content contract. Preserve empty file contents as supplied data rather than treating them as absent.
- [x] Established edit and patch payloads normalize into renderer-consumable native edit or patch data with the supplied paths and before/after text or patch information. Do not leave useful change text exclusively in raw metadata.
- [x] An ACP edit kind or location alone does not assert write, replacement edit, or patch identity. Use authoritative semantic evidence for conversions; ambiguous actions remain Generic Tool Activity while retaining their supplied details.
- [x] Every change from a multi-file call remains associated with that one activity. The consumer contract contains no second independent representation of the same changes, and multiple distinct changes to a file are not accidentally collapsed into one.
- [x] Updated replacement change collections supersede earlier collections. Removed or explicitly cleared changes do not remain as stale diff parts; omitted fields follow ACP retention semantics.
- [x] Preserve unrelated progress, structured output, display content, status, and supplied failure details on the owning activity while file details evolve. Do not infer success or missing file contents from the presence of a diff.
- [x] Prefer existing shared native representations. Where they cannot faithfully represent required multi-file changes or action details, include the smallest provider-neutral contract and shared-consumer change in this ticket. Migrate all affected callers, preserve other providers, and leave no compatibility shim or competing ACP-only representation.
- [x] Late identity, update-before-call, and interleaved file actions retain the original call ownership. Equivalent live and load/replay traces expose equivalent normalized file-change semantics.
- [x] Preserve original provider identity and relevant source payload details separately from normalized file data without adding persistence, telemetry, filesystem execution, or raw-payload logging.
- [x] Extend the existing real-adapter contract harness for write, single-file edit, patch, multiple files, empty before/after/content values, replacement and clearing, partial updates, failure details, and ambiguous fallback. Assert actual paths/content/changes and their unique ownership, not source text or incidental part counts.
- [x] Remove or update existing assertions that pin unnormalized inputs or duplicate tool-plus-diff representations when they conflict with the new contract. Do not re-pin implementation details as new expected behavior.
- [x] Run targeted adapter contract scenarios as behavioral smoke, relevant existing tests, required lint/type checks, and any existing suite affected by a shared-consumer change. Do not add a feature-specific browser/component/visual testing seam or redesign file tool cards.

## Scope and handoff

The parent spec in this feature directory is authoritative. This ticket owns any minimal shared contract/consumer adjustment required for faithful file changes and must land as a complete behavior. It is independent of tickets 02 and 04 once ticket 01 is complete. Test the public ChatEvent and ChatMessage contract, not pixels or renderer internals.
