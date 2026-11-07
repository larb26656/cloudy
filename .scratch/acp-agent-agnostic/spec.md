# Agent-agnostic ACP adapter

Status: resolved

## Problem Statement

Cloudy users want to connect agents through ACP without treating a particular agent or provider's data model as universal. The current adapter creates temporary sessions to discover models, reconstructs live and replayed messages differently, and cannot reliably reconcile history when an agent changes message IDs across loads. Cloudy’s message merge relies on exact IDs, so the same conversation may be displayed more than once or merged incorrectly. Some agents cannot restore their sessions or replay history; a stored Cloudy session binding does not guarantee that the conversation is available.

Users also need to see agent activity that does not fit the shared message model without silently losing its original data. They want the agent to own its conversation history rather than Cloudy maintaining a second durable ACP transcript.

## Solution

Provide a reusable ACP adapter that maps agent session activity into Cloudy's shared chat model consistently for live streams and history replay. Keep agent-owned history authoritative, retain only Cloudy session bindings and temporary presentation state, and expose capabilities and limitations honestly. Continue discovering models through temporary sessions, add a manual refresh, and display unsupported events with a generic raw-data fallback.

## User Stories

1. As a Cloudy user, I want to connect compatible agents through ACP, so that I can use different agents without changing the chat experience.
2. As a Cloudy user, I want each agent's actual capabilities reflected in the interface, so that I do not expect unsupported actions to work.
3. As a Cloudy user, I want the agent to own its conversation history, so that Cloudy does not persist a duplicate ACP transcript.
4. As a Cloudy user, I want my existing session binding retained, so that a session remains visible even if its agent cannot restore it.
5. As a Cloudy user, I want available history loaded from the agent, so that I can continue reviewing past conversation.
6. As a Cloudy user, I want an unavailable history shown as an empty chat with an indicator, so that I can see the session is unavailable.
7. As a Cloudy user, I want the input to remain available in that chat, so that I can still compose a message.
8. As a Cloudy user, I want a clear error if my message cannot be sent to the original session, so that I know it was not delivered.
9. As a Cloudy user, I want unsent text preserved after that error, so that I do not lose my work.
10. As a Cloudy user, I want Cloudy not to silently create a replacement session, so that I am not misled about the agent retaining previous context.
11. As a Cloudy user, I want streaming and replay to produce the same chat structure when agent data permits it, so that my conversation remains coherent.
12. As a Cloudy user, I want adjacent streamed text chunks combined, so that text is readable regardless of chunk size.
13. As a Cloudy user, I want tool calls displayed in the sequence they appeared, so that I can follow the agent's work.
14. As a Cloudy user, I want tool progress to update its own existing part, so that concurrent tools do not overwrite one another.
15. As a Cloudy user, I want delayed tool updates applied to the original message, so that activity is not attributed to the wrong turn.
16. As a Cloudy user, I want incomplete tool updates retained without invented details, so that I can see what the agent actually provided.
17. As a Cloudy user, I want text, reasoning and tools represented in a shared chat model, so that I can use the same interface with different agents.
18. As a Cloudy user, I want unrecognized activity shown generically, so that agent events are not silently lost.
19. As a Cloudy user, I want raw event details available on demand, so that I can inspect information the shared model does not capture.
20. As a Cloudy user, I want raw details collapsed by default, so that potentially sensitive data is not exposed unnecessarily.
21. As a Cloudy user, I want the model selector populated before starting a real conversation, so that I can choose a model using the existing flow.
22. As a Cloudy user, I want successful model discovery cached, so that normal use does not repeatedly create temporary sessions.
23. As a Cloudy user, I want discovery retried after failure, so that a temporary failure does not permanently hide models.
24. As a Cloudy user, I want to refresh models manually, so that changes in agent configuration become visible without restarting Cloudy.
25. As a Cloudy user, I want a failed refresh to keep the previous model list and report the error, so that I can continue using the last known choices.
26. As an integration developer, I want agent launch configuration separate from generic ACP behavior, so that adding an agent does not require duplicating the protocol adapter.
27. As an integration developer, I want session capability negotiation respected, so that optional methods are not assumed to exist.
28. As an integration developer, I want mapper identities and event semantics defined for consumers, so that live state and replay can use Cloudy's existing merge.
29. As an integration developer, I want real-agent smoke verification, so that assumptions based on fixtures are checked against an actual ACP implementation.

## Implementation Decisions

- Keep the existing provider seam and reusable ACP adapter. Agent profiles supply launch and configuration; do not hardcode a particular agent into generic mapping. Agent-specific handling is appropriate only when actual protocol behavior requires it.
- Agent-owned ACP history is authoritative. Do not persist a duplicate ACP transcript, send the full transcript with each prompt, or silently reconstruct agent context by replaying messages as a new prompt. Cloudy retains session bindings and temporary state required to render and merge activity. Other providers may own their history differently.
- Respect actual negotiated capabilities. Loading history, restoring agent context, and continuing a session are distinct outcomes; do not infer one from another. Preserve existing session bindings when restoration is unavailable.
- For a session whose history cannot be loaded, show an empty chat with an indicator. Keep input enabled. If the original session cannot accept a prompt, show an error and preserve the draft; do not silently create a replacement session.
- Map ACP live updates and replay through consistent rules into Cloudy messages and parts. By default each turn has one user message and one assistant message; text, thoughts and tool activity become ordered assistant parts. Do not invent a user message if replay does not provide one.
- Combine contiguous chunks of the same text stream into a single part independent of chunk boundaries; intervening different parts start a new text part. Tool calls and updates use the native tool-call identity within the session, including delayed updates after the active turn changes. Create a partial tool part when an update arrives first; retain unknown fields as unknown. Its position is determined by first appearance and does not move on later updates.
- The ACP adapter produces Cloudy message and part IDs before events reach the common merge. Use deterministic session-scoped structural identity based on turn and part position where agent data permits, rather than assuming ACP message IDs survive reload. Tool-call IDs associate updates within a session but must not be presumed stable across replay without evidence. Use the existing Cloudy merge; do not add separate reconciliation or replay-alignment detection in this scope.
- Accepted risk: absent stable IDs, incomplete or reordered replay can create duplicate messages or cause a wrong merge. Determinism alone cannot establish identity when available source data is insufficient. Do not claim correctness for every ACP agent.
- Make full part updates and text deltas mutually consistent with the existing consumer contract, so one chunk is not displayed twice. Do not assume the event transport supplies durable replay or deduplication.
- Normalize into shared types where meaningful. Preserve original provider data for a generic fallback, presenting actual raw payloads without inventing input/output fields. Show raw details on demand, collapsed by default. Preserve raw only in the transient state needed for presentation, not as a new durable ACP transcript. Do not introduce a provider-specific feature extension interface in this scope.
- Retain temporary-session model discovery to preserve selection before a real session. Clean up probe sessions when possible. Cache successful discovery for the adapter lifetime; allow retry after failure. Offer manual refresh from model selection; replace the cached list only after success, preserve the last successful list on failure, and report the failure and possible staleness.
- Preserve established chat context ownership and session selection behavior described in the existing architecture decisions. No database transcript schema is required for ACP.

## Testing Decisions

- Good tests exercise externally observable behavior, boundaries and state transitions through the highest existing seam practical, rather than asserting implementation wiring, incidental IDs or mock echoes.
- Prefer the Cloudy session/chat interface with a controllable fake ACP agent to exercise prompt streaming, replay, multiple turns, text chunk boundaries, tool interleaving, update-before-call, delayed tool updates and merge behavior. Assert live and replay identity and structure where the supplied protocol data supports that outcome; include the accepted ambiguity of incomplete or reordered replay without asserting an impossible universal guarantee.
- Cover unavailable restoration, empty history indicator, retained draft on send failure, and no silent replacement session at the UI/session seam. Verify generic fallback and raw disclosure on the actual UI surface.
- Cover successful discovery caching, retry after failure, manual refresh success, and failed refresh retaining the prior list. Use existing provider and session test patterns and the existing fake ACP agent tests as prior art.
- Exercise an actual agent when available: initialize, create a session, prompt, reconnect and load. Include multi-turn and tool activity where feasible. Real-agent smoke complements deterministic automated tests and must report environment limitations.
- Verify the UI displays each text chunk once when updates and deltas are processed, and that interleaved tool updates affect only their owning parts.

## Out of Scope

- Durable Cloudy-side ACP transcript, offline transcript index or search projection.
- A new provider-specific feature extension interface or exposing ACP-only features beyond the generic fallback.
- A new replay reconciliation engine, detection of reordered/incomplete replay, or guaranteed matching across all agents.
- Automatically creating a replacement session when restoration fails.
- Replacing temporary-session discovery with a different discovery architecture, persistent cache or cache expiry policy.
- Guaranteeing that every agent supports history loading, restoration or identical capabilities.

## Further Notes

An OMP 18.15.0 smoke over ACP v1 successfully initialized, prompted and loaded a session across processes. Its live message ID and IDs from two separate loads differed for the same conversation; native message IDs therefore cannot be assumed stable across replay. This smoke did not exercise the Cloudy adapter, multiple turns or tools; the local server package could not resolve the ACP SDK in that environment.

The existing Cloudy merge matches message and part IDs exactly; it does not infer identity from content. ACP v1 load and resume are separate negotiated capabilities, and neither should be assumed from the other. See the [ACP session setup specification](https://agentclientprotocol.com/protocol/v1/session-setup).
