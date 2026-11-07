# 03: Retire ended Questions and reject stale answers

**What to build:** Users stop seeing answerable Questions when their owning work or ACP connection ends. Answers racing completion or cancellation cannot revive a Question or resolve it twice, and a new server connection never pretends to restore an old response channel.

**Blocked by:** 01 — Answer session-scoped ACP Questions in chat.

**Status:** resolved

- [x] Remove pending Questions when the observable owning operation completes or is cancelled, the session stops/closes/is deleted, or the ACP connection terminates. Propagate cleanup to pending lists and waiting UI through the established event/query flow.
- [x] Settle outstanding protocol requests consistently with cancellation when the connection can still accept a response; release local state and resolvers when it cannot. A removed request is not still offered as answerable.
- [x] Unknown, completed, cancelled and disconnected Question replies fail without consuming another request. Competing submissions and replies racing cleanup resolve the original request at most once and cannot recreate its pending state.
- [x] Invalid submitted content remains correctable only while the Question is live; lifecycle cleanup wins over a later attempted correction.
- [x] Keep pending Questions tied to the live ACP connection. Server restart or a fresh connection exposes no answerable requests backed by old resolvers. If an agent issues a new Question, treat it as a new live request rather than resurrecting the old one.
- [x] Do not add a guessed Cloudy timeout. Retire requests using observable lifecycle signals, and document that an agent which silently stops waiting may ignore a late answer even if transport submission succeeds. Do not claim immediate detection of unannounced agent expiry.
- [x] Extend the confirmed HTTP/SSE integration seam to prove meaningful behavior for owning-operation completion, generation/session cancellation, session closure/deletion, agent disconnect, stale/repeated replies and reply-versus-cleanup races. Use controlled protocol/lifecycle signals rather than timing-dependent sleeps or live model credentials.
- [x] Browser-smoke terminal cleanup so the Question is no longer answerable and waiting state updates. Preserve existing Permission cleanup and non-ACP Question behavior; run relevant tests and repository checks and update affected documentation.
- [x] This ticket can be implemented without the multiple-Question ticket. Preserve unaffected Interactions during targeted cleanup using existing behavior; do not introduce a dependency solely to serialize edits to shared modules.

## Comments

Implemented on `integration/acp-question-interactions` in commit `a78d1918`; verified lifecycle cleanup through ACP integration tests and browser smoke.
