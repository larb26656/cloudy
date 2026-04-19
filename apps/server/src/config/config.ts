import z from "zod";
import { homedir } from "node:os";
import { resolve } from 'node:path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';

const ConfigurableSchema = z.object({
    configDir: z.string().default('~/.config/cloudy'),
    dataDir: z.string().default('~/.config/cloudy/data'),
    ui: z.boolean().default(false),
    host: z.string().default('localhost'),
    port: z.string().default('3000').transform(Number),
    cors: z.string().default('').transform((val) => val ? val.split(",").map((o) => o.trim()) : []),
    ocApiBasePath: z.string().default('http://localhost:4096'),
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

function getEnvConfig(): Partial<AppConfig> {
    return Object.fromEntries(
        Object.entries(ConfigurableSchema.shape).map(([key]) => {
            const envKey = `CLOUDY_${key.toUpperCase()}`;
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
    const merged = ConfigurableSchema.parse({ ...defaults, ...fileConfig, ...envConfig, ...cliFlags });
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