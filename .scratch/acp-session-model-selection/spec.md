# ACP session model selection

Status: resolved

## Problem Statement

Cloudy lists models offered by ACP agents, but selecting one does not cause the agent to use it. A user can believe a message is being answered by the chosen model while the agent actually uses its own model. Missing or rejected selections can therefore lead to unexpected results and costs.

## Solution

Apply the effective Cloudy model to the relevant ACP session before sending each message. Send only when the agent confirms that the selected model is available and active. If no model is selected, the selection is unavailable, or activation cannot be confirmed, report an error without sending the message and preserve the draft.

## User Stories

1. As a chat user, I want my selected model used by the ACP agent, so that the response comes from the model I chose.
2. As a chat user, I want my session model override to take precedence over the global default, so that I can choose a different model for one conversation.
3. As a chat user, I want the global default used when my session has no override, so that I do not need to choose a model for every session.
4. As a chat user, I want an error when neither selection exists, so that an agent cannot silently use an unintended model.
5. As a chat user, I want a changed selection applied before my next message, so that the new model answers that message.
6. As a chat user, I want changing one session's model to leave other sessions alone, so that my conversations remain independent.
7. As a chat user, I want removing a session override to use the global default, so that the default selection takes effect.
8. As a chat user, I want an error if I remove an override and no global default exists, so that the agent's previous model is not silently reused.
9. As a chat user, I want an error if the selected model is unavailable in the current session, so that another model is not substituted.
10. As a chat user, I want an error if the agent rejects a model change, so that my message is not sent to the wrong model.
11. As a chat user, I want an error if the active model cannot be confirmed, so that I can trust the displayed selection.
12. As a chat user, I want my draft retained after a selection error, so that I can correct the selection and retry.
13. As a chat user, I want a message to proceed when the agent already confirms the selected model is active, so that agents unable to change models can still be used safely.
14. As a chat user, I want a resumed session to honor my effective selection before its next message, so that restoration does not silently change models.
15. As a chat user, I want a model change to affect the next turn rather than interrupt an ongoing response, so that an in-progress answer is not disrupted.
16. As a chat user, I want response metadata to reflect the confirmed active model, so that the conversation history does not misattribute the answer.
17. As a chat user, I want a clear failure rather than an apparent successful send when model setup fails, so that I know my message was not delivered.

## Implementation Decisions

- Preserve the established effective-selection precedence: session override, then global default, then no selection. Do not silently replace a missing selection with the agent's default.
- Apply this behavior to ACP providers; do not change model selection semantics for other provider types.
- Use the model selection accompanying the message request and the target ACP session's advertised model configuration. Discovery/catalog availability alone is not proof that the model is available in a particular session.
- Before submitting a prompt, verify that the selected model is offered for that session and that the agent confirms it is active. If already confirmed active, no model-change operation is necessary, including when the agent cannot change models.
- Otherwise request the session model change through the applicable ACP configuration mechanism and confirm the resulting active value. Respect the actual model configuration option identifier rather than assuming that every agent uses the same identifier.
- Missing selection, unavailable model, unsupported change, rejected change, or inability to confirm the resulting model must fail before the prompt is sent. Surface an actionable error through the existing send error flow and preserve the draft.
- Apply selection after session creation or restoration and before every applicable turn; do not modify an in-progress turn. Ensure simultaneous operations cannot cause a prompt to run under another selection.
- Track current session configuration from creation, restoration and subsequent agent updates as needed; report the confirmed model in response metadata rather than the requested model when they differ.
- Retain the existing model discovery UI and session/global default ownership. No schema change is required by the agreed behavior.
- The existing per-session model selection decision remains in force.

## Testing Decisions

- Tests should exercise externally observable behavior: which model answers a prompt, whether a prompt was sent, error delivery, draft retention, and session isolation. Avoid assertions that merely pin internal wiring or implementation details.
- Prefer the existing ACP adapter integration seam with its subprocess fake agent: exercise session creation or restoration, configuration negotiation and prompts through the real protocol boundary. Extend the fake agent to expose distinct models and rejection/unsupported behavior.
- Cover selected-model changes, already-active models, missing selections, unavailable values, rejected changes, unconfirmed results, restored sessions, updates, independent sessions and competing sends. Verify failure does not deliver a prompt.
- Exercise the existing chat send/error boundary for effective selection precedence and draft preservation where needed; avoid duplicating protocol-level scenarios there. Existing ACP adapter and chat tests provide prior art.
- Run a smoke scenario through the changed send path in addition to relevant tests.

## Out of Scope

- Changing selection behavior for non-ACP providers.
- New model discovery interfaces, catalog redesign, model management settings, or database schema changes.
- Changing the model during an active response, or automatically falling back to another model after an error.
- Support for agent-specific model configuration outside the applicable ACP protocol.

## Further Notes

The ACP adapter validates and confirms the selected session model before prompting, and records the model confirmed for each turn.
