// types/cron.d.ts หรือ src/types/cron.ts
// FIXME: type error when building: https://github.com/elysiajs/elysia-cron/issues/54
// error TS2742: The inferred type of 'app' cannot be named without a reference to 'croner'.
// This is likely not portable. A type annotation is necessary.
export type { Cron } from "croner";