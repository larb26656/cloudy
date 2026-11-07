# 02: Answer multiple pending Questions independently

**What to build:** Users can discover, reopen and answer multiple live Questions without consuming another Question or another session's Interaction. Waiting state reflects all remaining Questions and Permissions, including for the existing automation policy.

**Blocked by:** 01 — Answer session-scoped ACP Questions in chat.

**Status:** resolved

- [x] Multiple Questions remain independently discoverable and answerable, including separate requests associated with the same tool call. Answering one removes only that request and allows access to those remaining.
- [x] Session and directory filtering isolate pending Questions across live conversations. A wrong-session or wrong-directory reply cannot consume a pending request; a Question cannot accidentally resolve a Permission with a similar identifier.
- [x] Directory-filtered Question listing and session-filtered pending checks agree on the applicable requests. HTTP and SSE expose the correct Cloudy session identities, including when provider identities differ.
- [x] Closing and reopening the Question presentation preserves access to pending requests. Reopening the UI or refreshing the browser rediscovers requests while the server-to-agent connection remains live; browser lifetime is not treated as ACP connection lifetime.
- [x] Resolving one Question leaves waiting-for-user state active if another Question or Permission remains. Resolving the last Interaction clears the established waiting state through the existing event/query flow.
- [x] ACP Questions participate in existing automation pending-Interaction detection without changing its human-interaction policy or supplying automatic answers.
- [x] Keep current read-only behavior and exact-session Question visibility. Do not add parent aggregation of child-session Questions or a global inbox.
- [x] Extend the existing HTTP/SSE integration seam with controlled ACP subprocesses and isolated SQLite to prove independent continuation outcomes, session/directory isolation, shared-tool-call request independence, mixed Question/Permission waiting state and rediscovery. Do not add internal test seams or source-text/forwarding assertions.
- [x] Browser-smoke multiple pending Questions, answering one while another remains, reopening the UI and observing correct waiting state. Run relevant existing tests and repository checks and update affected documentation.

## Comments

Implemented on `integration/acp-question-interactions` in commits `b5d34538` and `d2c699ef`; verified independent Questions through HTTP/SSE and browser smoke.
