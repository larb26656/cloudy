import z from "zod";
import { homedir } from "node:os";
import { resolve } from 'node:path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';

const ConfigurableSchema = z.object({
    configDir: z.string().default('~/.config/cloudy'),
    dataDir: z.string().default('~/.config/cloudy/data'),
    ui: z.union([z.boolean(), z.string()]).transform((val) => val === true || val === "true").default(false),
    host: z.string().default('localhost'),
    port: z.string().default('3000').transform(Number),
    cors: z.string().default('').transform((val) => val ? val.split(",").map((o) => o.trim()) : []),
});

export type CloudyConfig = z.infer<typeof ConfigurableSchema> & {
    dbDatabaseUrl: string;
    idea: string;
    memory: string;
    artifact: string;
};

type AppConfig = z.input<typeof ConfigurableSchema>;

function expanduser(path: string): string {
    if (path.startsWith("~/") || path === "~") {
        return path.replace("~", homedir());
    }

    return path;
}

export function camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).toUpperCase();
}

export function getEnvConfig(): Partial<AppConfig> {
    return Object.fromEntries(
        Object.entries(ConfigurableSchema.shape).map(([key]) => {
            const envKey = `CLOUDY_${camelToSnake(key)}`;
            return [key, process.env[envKey]];
        })
    ) as Partial<AppConfig>;
}

function resolveConfigDir(overrideConfigDir?: string): string {
    if (overrideConfigDir) {
        return expanduser(overrideConfigDir);
    }

    return expanduser('~/.config/cloudy');
}

function createInitConfig(configDir: string, defaults: object) {
    const configPath = resolve(configDir, 'config.json');
    if (!existsSync(configPath)) {
        mkdirSync(configDir, { recursive: true });
        writeFileSync(configPath, JSON.stringify(defaults, null, 2));
    }

    return {
        configPath
    }
}

export function loadConfig(cliFlags: Partial<AppConfig> = {}): CloudyConfig {
    const defaults = ConfigurableSchema.parse({});

    const configDir = resolveConfigDir(cliFlags.configDir as string | undefined);
    const { configPath } = createInitConfig(configDir, {
        host: 'localhost',
        port: '3000',
    });

    const fileConfig = ConfigurableSchema.partial().parse(JSON.parse(readFileSync(configPath, 'utf8')));
    const envConfig = getEnvConfig();
    const filteredCliFlags = Object.fromEntries(
        Object.entries(cliFlags).filter(([, v]) => v !== undefined)
    );
    const mergedInput = { ...defaults, ...fileConfig, ...envConfig, ...filteredCliFlags };
    const merged = ConfigurableSchema.parse(mergedInput);
    const dataDir = expanduser(merged.dataDir);

    return {
        ...merged,
        dataDir,
        dbDatabaseUrl: `file:${dataDir}/local.db`,
        idea: `${dataDir}/idea`,
        memory: `${dataDir}/memory`,
        artifact: `${dataDir}/artifact`,
    };
}