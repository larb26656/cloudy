# ACP Question interactions through session-scoped forms

Status: resolved

## Problem Statement

Cloudy users can answer Permission requests from ACP agents, but cannot answer Question Interactions through the same connection. A conversation that needs information or a choice can therefore fail to offer an answerable Question or remain blocked waiting for a response the user cannot deliver.

The limitation is broader than a rejected reply: the ACP adapter currently negotiates no form support, has no incoming elicitation handler or pending Question listing, and handles Interaction responses through its pending Permission state. Removing the explicit Question rejection would not provide a complete user flow.

Cloudy's existing Question presentation is also narrower than the standard ACP form model. Treating every form as a list of option labels would lose property identities, value types, optional fields, defaults and validation constraints.

## Solution

Let users receive, review and answer session-scoped ACP Questions in the existing chat Question flow. Use standard ACP form elicitation rather than an OMP-specific dialog transport, a Permission response, or a new chat message.

Present the requesting agent, the form's message, and controls appropriate to its declared fields. Let users submit a valid answer, explicitly decline, or explicitly cancel the Question. Closing the sheet only hides it so the pending Question can be reopened.

Keep pending Questions attached to the live ACP connection and reflect their lifecycle in existing pending-Interaction and waiting-for-user behavior. Support standard form schemas without depending on OMP's property naming conventions. Clearly reject unsupported scopes and modes rather than silently dropping them or pretending to support them.

## User Stories

1. As a chat user, I want an ACP agent's Question to appear in Cloudy, so that I can provide information without leaving the conversation.
2. As a chat user, I want Questions distinguished from Permissions, so that answering a request for information is not confused with authorizing an action.
3. As a chat user, I want to see which agent is requesting information, so that I understand who will receive my answer.
4. As a chat user, I want the agent's form message displayed, so that I understand what information is needed and why.
5. As a chat user, I want newly requested Questions reflected in the pending-Question UI, so that I can notice that the conversation needs my attention.
6. As a chat user, I want an existing pending Question discoverable when I open its session, so that missing the original event does not prevent me from answering.
7. As a chat user, I want Questions associated with the correct Cloudy session, so that I do not answer a different conversation's request.
8. As a chat user, I want multiple pending Questions to remain independently answerable, so that answering one does not remove another.
9. As a chat user, I want to enter ordinary text when a form requests a string, so that open-ended Questions are usable.
10. As a chat user, I want to choose a single declared option, so that I can answer single-selection Questions.
11. As a chat user, I want to choose multiple declared options when the form allows it, so that I can express all applicable choices.
12. As a chat user, I want readable option titles while the original option values are preserved, so that my visible choice has the meaning intended by the agent.
13. As a chat user, I want number and integer fields to retain their declared types, so that numeric answers are not delivered as text.
14. As a chat user, I want boolean fields to preserve both true and false, so that a false answer is not mistaken for an unanswered field.
15. As a chat user, I want field titles and descriptions displayed, so that I can interpret each requested value.
16. As a chat user, I want declared default values pre-populated and editable, so that I can review the agent's suggested answers before submitting.
17. As a chat user, I want required fields identified, so that I know which answers are necessary.
18. As a chat user, I want optional fields to remain optional, so that I am not forced to provide information the agent did not require.
19. As a chat user, I want invalid field values explained before submission, so that I can correct my answer.
20. As a chat user, I want form constraints respected, so that the agent receives answers within its declared limits.
21. As a chat user, I want custom text offered only where the form permits it, so that Cloudy does not invent an Other option that the agent cannot accept.
22. As a chat user, I want several fields collected in one form, so that I can review a related set of answers together.
23. As a chat user, I want to review and modify my answers before sending them, so that opening a Question does not automatically submit defaults.
24. As a chat user, I want submitting a valid form to resolve the original Question, so that the agent can continue its existing operation.
25. As a chat user, I want answering a Question not to create a new prompt turn, so that the original waiting request is answered rather than bypassed.
26. As a chat user, I want an explicit way to decline a Question, so that I can refuse to provide the requested information.
27. As a chat user, I want a separate way to cancel a Question, so that I can end the Interaction without submitting an answer or explicitly declining it.
28. As a chat user, I want closing the Question sheet only to hide it, so that an accidental dismissal does not send a response to the agent.
29. As a chat user, I want to reopen a hidden pending Question, so that I can answer it later while the request remains live.
30. As a chat user, I want cancelling a Question distinguished from stopping generation, so that I can choose the intended action.
31. As a chat user, I want a completed Question removed from the pending list, so that I do not answer it twice.
32. As a chat user, I want waiting-for-user state to reflect all remaining Interactions, so that answering one Question does not hide another pending Question or Permission.
33. As a chat user, I want an invalid answer to leave the Question pending, so that I can correct and resubmit it.
34. As a chat user, I want a stale or repeated answer rejected, so that a completed or cancelled Question cannot be resolved again.
35. As a chat user, I want Questions cleared when their owning operation ends or is cancelled, so that Cloudy does not continue inviting responses to work that has finished.
36. As a chat user, I want Questions cleared when their ACP connection closes, so that disconnected requests are not presented as answerable.
37. As a chat user, I want pending Questions rediscovered after reopening the UI while the server-to-agent connection remains live, so that a browser refresh does not itself lose an answerable request.
38. As a chat user, I want old requests not to appear answerable after a server restart, so that Cloudy does not promise to restore a response channel it no longer has.
39. As a chat user, I want the same form behavior across compatible ACP agents, so that answering Questions does not depend on agent-specific field names.
40. As an OMP user, I want its ACP ask forms answerable in Cloudy, so that I can choose options or supply declared custom input without switching to another transport.
41. As a user of another provider, I want existing Question and Permission flows preserved, so that enabling ACP Questions does not break conversations that already work.
42. As a user, I want unsupported Interaction scopes or modes to fail clearly, so that an unavailable answer channel does not leave an operation silently hanging.
43. As a user, I want Cloudy not to fabricate expiry times, so that a valid Question is not discarded based on a guessed timeout.
44. As a user, I want the limitations of late answers understood, so that transport submission is not misrepresented as proof that an agent which silently stopped waiting used my answer.
45. As an automation user, I want ACP Questions included in existing pending-Interaction detection, so that unattended work follows the established waiting-for-human policy instead of overlooking a Question.
46. As a keyboard or assistive-technology user, I want labelled controls, accessible errors and usable Question actions, so that the form can be completed without relying on pointer-only interaction.

## Implementation Decisions

- Preserve the domain distinction: Interaction is the umbrella concept; Question requests information or choices; Permission requests authorization. Do not represent a Question as a Permission merely to reuse approval transport.
- Implement standard ACP form elicitation in the shared ACP adapter module. Register the incoming elicitation handler and explicitly advertise form capability during initialization only with the complete in-scope implementation in place. OMP continues to use its existing ACP launch integration; do not introduce OMP RPC dialog frames.
- Support session-scoped form requests, including their optional tool-call association. Do not advertise URL capability. Request-scoped forms outside a session are not supported by this feature.
- ACP has no separate capability for session-only forms. Advertising form capability therefore cannot prevent a compliant agent from sending a request-scoped form. Return an explicit unsupported-scope protocol error for that case, without creating a fake session, fabricating a user response, or leaving the request pending. Reject unadvertised URL mode through the protocol's invalid-parameters behavior.
- Expand the shared Question interface to represent the standard ACP flat-object form schema losslessly: stable property keys, string, number, integer and boolean fields, single-select string enums, multi-select string enums, display titles/descriptions, required properties, defaults and the constraints declared by each supported standard field type. This is the restricted ACP form schema, not arbitrary JSON Schema.
- Preserve the difference between option display titles and submitted values. Maintain numeric and boolean value types, valid falsy values, omitted optional properties, and required-property semantics. Do not flatten form answers into the existing positional arrays of option labels.
- Cover the standard schema's declared constraints, including applicable string length, pattern and format constraints, numeric bounds, and multi-select constraints. Preserve optional/null schema-field semantics defined by the protocol. Do not add a blanket requirement for every field to be answered.
- Do not synthesize free-text Other choices for closed enums. Render a custom-input field when the schema declares one; OMP's custom-input properties are ordinary schema properties, not a naming convention for the shared adapter to interpret specially.
- Use explicit form response actions: accept with schema-conforming content, decline for explicit refusal, and cancel for explicit Question cancellation. Preserve the existing OpenCode Question behavior while extending the shared contract as needed. Keep provider-specific translation behind the provider adapter interface rather than leaking it into chat controls.
- Reuse existing session Question listing and reply interfaces, normalized provider events, capability-gated queries, pending-Interaction checks, and chat Question presentation. Update all affected consumers together, including provider-scoped callers of the shared Question operations. Do not add a parallel question subsystem or leave obsolete reply paths as compatibility shims.
- Track pending ACP Questions separately from pending Permissions. Bind each pending Question and its resolver to the live ACP connection, provider session, Interaction identity and observable owning operation. Verify session and directory ownership before accepting a reply. Independent Questions must remain independent even if associated with the same tool call.
- Translate between provider session identities and Cloudy session identities consistently for listing, replies and events. Question lookup must never depend on finding a pending Permission first. Preserve current session visibility and read-only presentation rules; this feature does not expand parent sessions to aggregate child-session Questions.
- Both directory-filtered listing and session-filtered pending checks must discover the same applicable pending Questions. A browser refresh does not close the server-to-agent connection and must not itself discard its pending requests.
- Validate accepted form content against the original requested schema at the server interface as well as in the form UI. Invalid content returns a validation failure without resolving or removing the pending Question. Wrong ownership, unknown, already-completed and stale Interactions must not resolve another request. Resolve each pending request at most once, including competing replies.
- Closing or dismissing the sheet changes presentation only; it sends no ACP response and does not remove the Question. Provide distinct, clearly labelled submission, decline and Question-cancellation actions. Question cancellation is not the generation-stop action.
- Resolve pending Questions with the selected ACP action, remove only the affected request, and refresh existing pending lists and waiting-for-user state through the established event/query flow. A session remains waiting when another Question or Permission is still pending. Connection or lifecycle cleanup must also become visible through that flow, not leave stale answerable UI.
- Tie lifetime to observable ownership: remove Questions when their owning operation completes or is cancelled, the session is stopped/closed/deleted, or the ACP connection terminates. Settle outstanding protocol requests consistently with cancellation while the connection can still accept responses, and release local state/resolvers when it cannot. Prevent a reply racing cleanup from reviving or resolving a removed request.
- Keep pending Questions in live connection state, consistent with current ACP Permissions. Do not add database persistence or promise answers across server restart. A subsequent connection may expose a newly issued Question, but cannot reuse the old resolver or Interaction identity as though it survived.
- Do not invent a client-side timeout. Use observable operation completion, cancellation and connection closure to retire requests. If an agent silently times out its own wait without withdrawing the form, Cloudy cannot know immediately; do not claim that successful transport delivery proves the agent used a late answer.
- Preserve existing Permission behavior and existing non-ACP provider behavior. Include ACP Questions in the established automation pending-Interaction policy rather than adding automatic answers or a new automation policy.
- Follow the existing frontend form, accessibility and shared-control conventions. Let users review and change defaults before submission, identify the requesting agent, and preserve the protocol distinction between ordinary non-sensitive form data and URL-based sensitive workflows. Do not build a credential-collection flow under form support.
- Keep the accepted chat-action ownership and per-session context decisions in force. Form support does not move message sending or generation cancellation into a second global owner.

## Testing Decisions

- The user confirmed one primary permanent test seam: Cloudy's HTTP and SSE interface, using the real session/provider modules, real ACP adapter, an isolated SQLite test environment, and a controlled ACP agent subprocess connected through the installed SDK. Prefer this existing high-level seam over new adapter-only, controller-only and UI-mock test layers.
- Prior art is the existing ACP Permissions-through-the-sessions-API integration coverage, which launches an SDK-backed subprocess and exercises Cloudy/provider session identity differences, listing, replies, invalid selections and repeated responses. Reuse that fixture approach and the existing provider event-stream interface rather than adding a new transport or dependency-injection seam.
- Good tests prove consumer-visible behavior and state transitions: a Question becomes discoverable, a valid answer releases the waiting operation with the intended meaning, explicit actions remain distinct, invalid or stale replies do not release it, and pending state matches what remains. Do not pin private maps, resolver implementation, method-call forwarding, source text, incidental defaults, error wording or copied payloads.
- The fixture agent must consume answers to drive distinguishable continuation outcomes, including choices whose meaning depends on preserved keys and value types. Merely echoing a submitted payload or asserting that a mock received it is not sufficient proof of an answerable conversation.
- Exercise initial negotiation and incoming form handling through externally observable behavior: a form-aware agent can ask and complete an in-scope Question. Also verify that unsupported request scope and URL mode fail explicitly without hanging the operation or creating a pending Question.
- Cover session identity mapping and isolation across multiple live sessions/directories, independent concurrent pending Questions, and shared tool-call associations without conflating request identities. Ensure a reply cannot consume a Permission with a similar identifier.
- Cover standard form content using behaviorally distinct cases: plain strings, single-select enum values distinct from titles, multi-select values, integers versus fractional numbers, zero, false, defaults that can be changed, required versus omitted optional properties, and declared validation limits. Include a schema with property names unrelated to OMP and an OMP-shaped form using the same generic path.
- Cover accept, decline and cancel as distinct outcomes; listing and waiting state after each; invalid content remaining pending; repeated/stale replies; and competing completion/cancellation so only one result reaches the owning request.
- Cover pending-state cleanup after owning-operation completion, generation/session cancellation, session deletion/closure and agent disconnect. Prove that another still-live Interaction keeps the session in its established waiting state, and a fresh connection does not expose answerable requests from a closed connection.
- Exercise normalized Question delivery through SSE and rediscovery through HTTP listing, including Cloudy session identifiers and the capability information used by the browser. Avoid duplicate tests that only recheck internal event forwarding.
- Preserve relevant existing Permission and OpenCode Question contract coverage. Update tests broken by an intentional shared-interface change, without retaining tests that only pin obsolete wording or incidental implementation behavior.
- Verify the actual changed UI with a browser smoke scenario against the controlled ACP agent: display agent/message, interact with representative field types and defaults, see validation errors, close without replying, reopen the still-pending Question, submit/decline/cancel, and observe the operation and waiting state transition. Verify keyboard interaction and accessible field/error associations. This is runtime proof, not a second new permanent test seam.
- Run relevant existing suites, repository lint/typechecking and applicable frontend design checks after implementation. A test pass alone is not proof that the Question sheet is usable. Do not require model credentials or a live external model for deterministic integration coverage; a real-agent smoke can supplement, not replace, the deterministic proof.

## Out of Scope

- ACP URL elicitation, browser navigation/consent flows, OAuth, and collection of credentials or secrets.
- Request-scoped elicitation outside a session, a global Question inbox, and synthetic sessions to host those forms.
- OMP RPC integration, agent-specific dialog protocols, and hardcoded interpretation of OMP field names.
- Answering through a new chat prompt, converting Questions to Permissions, or silently choosing answers on the user's behalf.
- Arbitrary JSON Schema, nested object forms, or data types outside the restricted standard ACP form schema.
- Persisting pending protocol requests, restoring their response channels across server restart, or a new database schema for Interactions.
- Guessed expiry times, new retry policies, polling an agent for undocumented expiry information, or guarantees that an agent which silently stopped waiting will use a late answer.
- Redesigning the overall chat shell, changing read-only policy, aggregating child-session Questions into parent chat, or changing unrelated provider/model behavior.
- Automatic answers or a new human-interaction policy for automations.
- A parallel permanent browser-test architecture or additional internal test seams for behavior covered by the confirmed HTTP/SSE seam.

## Further Notes

- This spec synthesizes the confirmed design interview, including the user's explicit choice of session-scoped support after clarifying that standard ACP also defines request-scoped forms. The test seam was separately confirmed before publication. No further product interview is required to begin implementation.
- [ACP elicitation specification](https://agentclientprotocol.com/protocol/v1/elicitation.md) defines capability advertisement, session/request scopes, form versus URL mode, response actions and privacy requirements. [The ACP schema reference](https://agentclientprotocol.com/protocol/v1/schema.md#elicitation%2Fcreate) defines the restricted form fields and request variants. Use the installed SDK's supported schema/types when implementing rather than assuming arbitrary JSON Schema support.
- The installed ACP SDK was inspected at version 2.2.0. A runtime check returned protocol version 1 and the standard elicitation/create method. That proves the installed method is available, not that Cloudy already implements the feature.
- [OMP v18.18.0 upstream's form bridge](https://github.com/can1357/oh-my-pi/blob/v18.18.0/packages/coding-agent/src/modes/acp/acp-agent.ts#L514-L598) can stop waiting locally without withdrawing the client-side form and ignores late results. [Its ask mapping](https://github.com/can1357/oh-my-pi/blob/v18.18.0/packages/coding-agent/src/modes/acp/acp-agent.ts#L689-L766) uses standard session-scoped form elicitation. Upstream source was inspected; the installed OMP runtime was not exercised and no real model was invoked.
- Not supporting request-scoped forms is a deliberate interoperability limit, not a capability the ACP handshake can express. This limitation must remain explicit in user/developer documentation and protocol failure behavior.
- The existing glossary definitions and accepted chat ownership/session-context ADRs remain authoritative. No new ADR or implementation work is included in this publication.
- Completion requires the full receive/list/present/respond/cleanup behavior and runtime UI proof described above; deleting the current rejection or publishing Question capability alone is not completion.
