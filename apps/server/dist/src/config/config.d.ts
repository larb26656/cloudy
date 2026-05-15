import z from "zod";
declare const ConfigurableSchema: z.ZodObject<{
    configDir: z.ZodDefault<z.ZodString>;
    dataDir: z.ZodDefault<z.ZodString>;
    ui: z.ZodDefault<z.ZodPipe<z.ZodUnion<readonly [z.ZodBoolean, z.ZodString]>, z.ZodTransform<boolean, string | boolean>>>;
    host: z.ZodDefault<z.ZodString>;
    port: z.ZodPipe<z.ZodDefault<z.ZodString>, z.ZodTransform<number, string>>;
    cors: z.ZodPipe<z.ZodDefault<z.ZodString>, z.ZodTransform<string[], string>>;
}, z.core.$strip>;
export type CloudyConfig = z.infer<typeof ConfigurableSchema> & {
    dbDatabaseUrl: string;
    idea: string;
    memory: string;
    artifact: string;
};
type AppConfig = z.input<typeof ConfigurableSchema>;
export declare function camelToSnake(str: string): string;
export declare function getEnvConfig(): Partial<AppConfig>;
export declare function loadConfig(cliFlags?: Partial<AppConfig>): CloudyConfig;
export {};
