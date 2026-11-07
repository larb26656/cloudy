# 01: Answer session-scoped ACP Questions in chat

**What to build:** A user can receive a session-scoped ACP Question, review and edit a standard form, submit an answer, explicitly decline or cancel, and observe the agent continue its existing operation. Closing the sheet only hides the pending Question; reopening it permits an answer while it remains live. Deliver the complete single-Question path, not an adapter-only change or a partial schema renderer.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [x] Use standard ACP form elicitation through the shared ACP adapter, including capability negotiation, incoming handling, pending listing, normalized events, reply resolution and waiting-state updates. Do not use OMP RPC, new chat prompts or Permission responses as substitutes.
- [x] Represent the restricted standard form schema losslessly across the shared Question interface, session/provider interfaces and chat UI: property keys, strings, numbers, integers, booleans, single/multi-select enums, option titles versus values, required properties, defaults and declared constraints. Do not advertise form capability with only a subset of the standard field types implemented.
- [x] Display the requesting agent and message. Provide accessible, labelled controls and errors; allow review and changes before submission. Preserve zero, false, omitted optional properties and typed answers. Offer custom input only when declared by the form, without interpreting OMP-specific property names.
- [x] Valid accepted content resolves the original request and lets the owning operation continue with the intended meaning. Validate against the original schema on the server as well as in the UI. Invalid content leaves the Question pending and correctable.
- [x] Explicit refusal sends decline; explicit Question cancellation sends cancel. These actions are distinct from stopping generation. Closing the sheet sends no response and permits reopening the pending Question.
- [x] Correctly translate provider and Cloudy session identities across HTTP listing, replies and SSE. Replies look up Questions independently of Permissions and enforce session/directory ownership. Complete requests are removed and repeated replies are rejected.
- [x] Reject request-scoped forms outside a session with an explicit unsupported-scope protocol error. Do not create synthetic sessions or leave requests hanging. Do not advertise URL support; reject unadvertised URL mode using protocol invalid-parameters behavior.
- [x] Provide normal single-request cleanup without leaving an answerable request after its connection closes. Keep pending requests live-memory-only, with no guessed timeout or automatic answers. The dedicated lifecycle ticket extends terminal-path and race coverage rather than licensing a leaked baseline request.
- [x] Preserve existing Permission and OpenCode Question behavior while migrating affected shared-interface consumers together. Respect existing read-only presentation and chat-action ownership; do not leave compatibility shims or introduce a parallel Question subsystem.
- [x] Use the confirmed permanent test seam: real Cloudy HTTP/SSE modules and ACP adapter, isolated SQLite, and an SDK-backed controlled agent subprocess. Assert meaningful continuation outcomes dependent on submitted types/values, not mock forwarding or payload echoes. Include non-OMP property names and an OMP-shaped form through the same generic behavior.
- [x] Demonstrate representative field types, editable defaults, validation, hiding/reopening, submit, decline and cancel through the actual chat UI in a browser smoke. Run relevant existing tests, lint/typechecking and applicable frontend design checks; update affected documentation. No second permanent UI-test seam is required.

## Comments

Implemented on `integration/acp-question-interactions` in commits `206d092d`, `d2c699ef`, and `dfdfbd49`; verified with ACP integration tests and controlled-agent browser smoke.
