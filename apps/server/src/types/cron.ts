// Minimal type declaration for Cron from croner
// croner is used by elysia-cron but types are not available
declare module 'croner' {
    export type Cron = string;
}