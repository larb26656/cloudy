# Normalize ACP Tools into Native Tool Activity

Status: resolved

## Problem Statement

ACP agents report tool actions, but Cloudy often exposes their raw payloads instead of useful Native Tool Activity. Users cannot reliably recognize a skill invocation, file write, file edit, command execution, or other tool action from the same structured information available for Cloudy's existing tools.

The current adapter already emits tool message parts. The gap is semantic normalization: provider names and input shapes pass through without necessarily satisfying Cloudy's native tool contract. Names arriving in later updates are not adopted. ACP diff content is retained separately, but its current representation does not provide the intended native edit presentation. Raw event availability therefore does not establish that an action is usable through the shared contract.

Users need recognizable tool details, truthful execution status, and available results without inspecting raw provider payloads. Behavior must remain consistent during live updates and when the agent supplies equivalent history on reload.

## Solution

Normalize ACP tool actions at the shared adapter boundary into Cloudy's existing provider-neutral tool vocabulary and consumer-facing message contract.

Recognized tools provide the native input, output, status, and change details supported by the agent's actual data. Skill calls expose the skill name; file actions expose available paths and contents or changes; command actions expose the command and available output. Other supported native tools receive equivalent normalization when their identity and payload semantics are established.

Unrecognized or insufficiently described actions remain Generic Tool Activity. They retain available details, execution status, and raw provider metadata without inventing a more specific identity. Raw details remain available through the existing collapsed disclosure rather than becoming the primary presentation.

Each tool call is one logical activity throughout its lifecycle. File changes belong to that activity, including multi-file edits, without duplicate standalone change representations. Live events and replayed history expose equivalent normalized activity when the agent supplies equivalent information.

This applies to the reusable ACP adapter and therefore to all providers using it, including OMP. It is not an OMP-only special case.

## User Stories

1. As a Cloudy user, I want ACP tool actions to use Native Tool Activity, so that I can understand them without reading provider JSON.
2. As a Cloudy user, I want equivalent actions from different ACP providers to use the same vocabulary, so that changing agents does not change how I interpret tools.
3. As a Cloudy user, I want a recognized skill invocation to expose the supplied skill name, so that I know which capability the agent is using.
4. As a Cloudy user, I want a file write to expose the supplied file path, so that I know which file is being created or replaced.
5. As a Cloudy user, I want a file write to retain supplied file content, so that I can inspect what the agent wrote.
6. As a Cloudy user, I want a file edit to expose the supplied file path, so that I know what is being changed.
7. As a Cloudy user, I want supplied before-and-after text or patch information to reach the native change contract, so that the edit is inspectable rather than existing only in raw metadata.
8. As a Cloudy user, I want a tool that edits multiple files to retain every supplied change, so that I do not overlook part of the action.
9. As a Cloudy user, I want file changes to appear as part of one logical tool activity, so that the same edit is not represented twice.
10. As a Cloudy user, I want a command action to expose the supplied command, so that I can understand what the agent ran.
11. As a Cloudy user, I want command output to remain available as it is reported, so that I can inspect progress and results.
12. As a Cloudy user, I want recognized file-read and search actions to retain their native parameters, so that ordinary ACP tools are not restricted to the first few supported categories.
13. As a Cloudy user, I want other established native tool types to receive equivalent treatment when their semantics are known, so that normalization is consistent across the tool vocabulary.
14. As a Cloudy user, I want pending, running, completed, and failed tool states to remain distinguishable, so that I can tell what the agent is doing.
15. As a Cloudy user, I want supplied failure details to remain attached to the failed action, so that I can understand why it failed.
16. As a Cloudy user, I want partial tool information to remain visible as an activity, so that an action does not disappear while the agent is still describing it.
17. As a Cloudy user, I want a name or input supplied in a later update to enrich the existing activity, so that the action becomes recognizable without creating a second call.
18. As a Cloudy user, I want an update arriving before the initial call notification to remain associated with that call, so that event order does not lose useful activity.
19. As a Cloudy user, I want interleaved calls to keep their own input, output, and status, so that concurrent tool activity is not mixed together.
20. As a Cloudy user, I want delayed updates to remain attached to their original activity, so that later conversation turns do not acquire another call's results.
21. As a Cloudy user, I want equivalent live and replayed tool information to normalize consistently, so that reopening a conversation does not change the meaning of an action.
22. As a Cloudy user, I want Generic Tool Activity for an unfamiliar provider tool, so that unsupported names do not hide its available details.
23. As a Cloudy user, I want ambiguous actions to remain generic rather than being guessed from their titles, so that Cloudy does not falsely describe an action.
24. As a Cloudy user, I want missing command text, file content, skill names, and statuses to remain honestly missing, so that displayed activity does not claim information the agent never supplied.
25. As a Cloudy user, I want original provider details to remain inspectable separately from normalized fields, so that troubleshooting does not depend on losing the source data.
26. As a Cloudy user, I want raw details to retain their existing collapsed presentation, so that technical payloads do not overwhelm ordinary activity.
27. As a Cloudy user, I want current replacement content to supersede obsolete file changes, so that corrected updates do not leave stale edits behind.
28. As a Cloudy user, I want empty content and explicitly cleared fields to follow ACP semantics, so that an old value is not incorrectly presented as the current result.
29. As a Cloudy user, I want supplied display content and structured output to retain their distinct useful information, so that one form of result does not silently erase another.
30. As a Cloudy user, I want tools without enough information for a specialized native presentation to remain inspectable, so that incomplete provider support does not become silent data loss.

## Implementation Decisions

- The shared ACP adapter owns provider-to-Cloudy normalization. The UI must not interpret raw ACP payloads to recover tool identity or native input fields.
- Use the glossary's Native Tool Activity and Generic Tool Activity concepts. These are tool actions, not Questions or Permissions. Tool normalization does not change the separate Interaction workflows or the Command Catalog.
- Keep the existing public boundary: live `ChatEvent` values and history `ChatMessage` values containing provider-neutral message parts. No new endpoint, database migration, or provider launch configuration is required.
- Reuse the existing native tool vocabulary and input contracts. Important established shapes include skill name; write file path and content; edit file path and old/new text; command text; and the parameters consumed by the other existing native tool categories.
- Recognize identity using explicit tool identity and validated protocol or provider payload semantics. A human-readable title, a broad ACP kind, or a familiar-looking substring alone must not assert a specific tool. For example, ACP `edit` kind alone does not distinguish a write, replacement edit, or patch operation.
- Use ACP kind, locations, and display content to retain supported descriptive information without fabricating tool identity or missing input. Title-only and ambiguous calls remain Generic Tool Activity.
- Accept identity and other information supplied by either an initial call or a later call update. A later explicit name must not be ignored merely because it arrived in an update.
- Preserve the original provider identity and payload details separately from canonical fields. Normalize only established equivalent input shapes; do not maintain speculative aliases for unobserved provider formats.
- Apply the behavior to every provider using the generic ACP adapter. OMP's launch wrapper must not become a second normalization pipeline.
- Maintain one logical tool part per ACP call ID within its session. Updates enrich or replace the corresponding information on that activity rather than creating duplicate activities or rebinding it to the current turn. Keep independent sessions and calls isolated.
- Preserve the existing correspondence between ACP `in_progress` and Cloudy `running`, and between failed top-level tool status and error state where the richer native state is used. If both top-level fields and richer state are supplied, their meanings must agree. Do not invent status, error text, timestamps, or completion for partial calls.
- Preserve available native input and output as structured data where applicable. Native fields should not contain ACP content envelopes in place of the actual command text, file details, or human-readable result they represent.
- Treat omitted update fields, explicit clearing values, and replacement collections according to ACP semantics. An omitted field must not accidentally erase prior knowledge; an explicit supported clear or empty replacement must not accidentally retain stale data.
- Preserve useful structured output and supplied display content without silently discarding one merely because the other exists. Keep provider-only details behind metadata rather than requiring consumers to understand ACP envelopes.
- Keep every supplied file change associated with its owning tool activity. Produce renderer-consumable native edit or patch data, including all files changed by one call. Do not also emit a second independent representation of the same change. Replacement change collections must not accumulate stale changes from earlier updates.
- Prefer existing shared native tool representations. If a multi-file action or required action details cannot be faithfully represented by those contracts, make the smallest provider-neutral contract and shared-consumer adjustment necessary; do not introduce ACP-specific renderer branches or a parallel UI. This is not authorization for a UI redesign.
- Preserve terminal references and other supported content as actual supplied data. A terminal reference is not itself command text or captured output, and must not be expanded into invented execution details.
- Use the same normalization semantics for live updates and replayed history. Equality concerns the supplied action information and call ownership, not undocumented cross-reload message-ID stability or unavailable history.
- Raw metadata is inspection data, not a newly promised durable event log. Retain source details needed to explain normalization without adding persistence or telemetry. Preserve the existing default-collapsed disclosure behavior; this work does not introduce automatic raw-payload logging.
- Existing non-tool conversation behavior and other providers' canonical tool behavior must remain intact. Migrate affected consumers if a minimal shared contract adjustment is necessary rather than leaving compatibility shims or competing representations.

## Testing Decisions

- The agreed primary seam is the ACP adapter's consumer-facing contract: live `ChatEvent` output and history `ChatMessage` output. Test this boundary, not browser DOM, component internals, or renderer selection implementations.
- Reuse the existing real-adapter harness with a deterministic fixture agent communicating over ACP. Drive protocol notifications and inspect the adapter's public event subscription and history methods. This provides one contract seam instead of separate mapper, transport, and UI feature suites.
- Prior art exists in the adapter tests for reasoning and tool updates, replayed history, partial calls, interleaved calls, delayed updates, and reconstruction of live events into the message contract. Extend the behavioral coverage rather than asserting the current pass-through implementation.
- A good test proves consumer-visible contract meaning: exact normalized tool identity and useful parameters; supplied output and failure details; correct ownership; transitions; and replacement semantics. It must fail if an action becomes generic unexpectedly, points at the wrong file, loses output, invents details, or duplicates a change.
- Use protocol-valid fixtures that establish the semantics of each tested input. Fake agents are test fixtures, not production fallbacks. Do not describe a synthetic fixture as captured OMP behavior.
- Cover skill, write, edit, command, representative additional established native categories, and unknown tools. Assert meaningful field values rather than merely checking that a part exists or a list grew.
- Cover missing and late names, missing statuses, update-before-call, interleaved call IDs, delayed updates to an earlier turn, and identical call IDs in different sessions. Verify isolation and enrichment without fabricating missing values.
- Cover pending to running to completion and failure, including consistency of top-level and richer state when both are present. Check actual supplied failure information rather than only a terminal status.
- Cover text/display content, structured output, coexistence of both, terminal-reference-only content, and missing data. Verify useful information remains available without interpreting a terminal reference as command output.
- Cover single-file and multi-file diffs, empty file contents, and replacement or cleared content. Verify every supplied change is represented once under the owning activity and obsolete changes do not survive replacement.
- Exercise equivalent tool traces through live and load/replay paths and compare normalized semantic results. Include available intermediate live states, not only final history. Do not require replay data the fixture did not emit or stable IDs the ACP provider does not promise.
- Verify raw provider details remain separate and available in the contract. Do not add a new UI test for the already-established collapsed disclosure behavior.
- Update or remove existing assertions that pin unnormalized input keys, raw ACP envelopes as native output, or duplicate tool-plus-diff representations when those assertions contradict this spec. Do not replace them with source-text or incidental-structure assertions.
- No new browser, component, visual, or end-to-end UI suite is required for this feature. Native renderer requirements inform the data contract, but the agreed verification boundary is the contract, not proof of pixels.
- During implementation, run the targeted adapter contract scenarios as the behavioral smoke, then the repository-required lint and type checks and relevant existing tests. Run any existing suite affected by a shared-consumer change; do not add a second feature-specific UI verification seam.

## Out of Scope

- Executing tools inside Cloudy instead of the ACP agent, or adding filesystem or terminal execution capabilities.
- Changing Question, Permission, elicitation, or approval behavior.
- Changing command discovery, slash commands, model selection, session restoration policy, or provider process management.
- An OMP-specific adapter fork or an unrestricted alias list inferred from arbitrary names and titles.
- Guessing missing skill names, command strings, file contents, diffs, output, statuses, or error details.
- Guaranteeing identical histories when an agent omits or changes the replayed data, or fixing unrelated cross-reload message identity behavior.
- A new raw-event archive, database schema, migration, telemetry pipeline, automatic payload logging, or expanded data retention.
- A UI redesign, new tool-card visual language, browser test suite, or component-test campaign.
- Retrieving terminal output or other external resources that the agent has not supplied through the supported contract.
- Normalizing unrelated unknown ACP notification types beyond preserving their existing fallback behavior.
- Implementing this feature as part of writing this specification.

## Further Notes

The requirements were agreed in the design discussion. The user explicitly selected contract-level verification instead of verification through the UI. This specification records that decision; it must not be expanded into a UI testing project.

Code inspection establishes a normalization gap, including pass-through tool inputs, ignored late names, and diff representation limitations. It does not establish which exact payload shapes a real OMP skill, write, edit, or command invocation currently emits. Local documented OMP smoke runs did not supply captured tool traces. Do not claim otherwise or hard-code an assumed OMP wire shape. Establish any provider-specific conversion from authoritative implementation/protocol evidence or a sanitized real trace; unknown shapes must remain truthful Generic Tool Activity.

Existing architecture decisions about chat ownership and per-session state remain unchanged. No new ADR is required for reusing the shared adapter boundary and existing native tool vocabulary.

Implementation tickets are recorded in the `issues/` directory.
