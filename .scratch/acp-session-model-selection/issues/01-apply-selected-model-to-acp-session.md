# 01: Apply the selected model to the ACP session

**What to build:** Ensure each ACP message is answered by the effective model selected in Cloudy, rather than silently using the agent's own choice. Use the session override before the global default. Validate the model against the session and confirm it is active before sending. When selection or activation fails, report an error without sending and preserve the draft. See the feature spec for the complete agreed behavior.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [x] A session override takes precedence over the global default; removing it uses the global default for the next message.
- [x] If neither selection exists, sending fails, no prompt is delivered, and the draft remains available.
- [x] A selected model offered by the session is activated and confirmed before the next prompt; an already-confirmed active model works even if the agent cannot change models.
- [x] An unavailable model, rejected or unsupported change, or unconfirmed active model produces an actionable error, does not send the prompt, and preserves the draft.
- [x] New and restored sessions honor the effective selection; changing a selection affects the next turn without interrupting an active response.
- [x] Independent sessions and competing sends cannot cause a prompt to run under another selection.
- [x] Response metadata reflects the confirmed active model, and non-ACP providers retain their existing behavior.
- [x] Behavior is covered at the existing ACP protocol integration seam and, where needed, the chat send/error boundary; relevant tests and a send-path smoke scenario pass.
