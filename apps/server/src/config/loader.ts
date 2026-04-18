import { homedir } from "node:os";

export const DEFAULT_CONFIG_DIR = "~/.config/cloudy";

export type CloudyConfig = {
    configDir: string;
    assistantBasePath: string;
    ocApiBasePath: string;
    dbDataDir: string;
    dbDatabaseUrl: string;
    idea: string;
    memory: string;
    artifact: string;
};

function expanduser(path: string): string {
    if (path.startsWith("~/") || path === "~") {
        return path.replace("~", homedir());
    }
    return path;
}

function getConfigDirFromEnv(): string | undefined {
    return process.env.CLOUDY_CONFIG_DIR;
}

function getDefaultConfigDir(): string {
    return expanduser(DEFAULT_CONFIG_DIR);
}

function resolveConfigDir(overrideConfigDir?: string): string {
    if (overrideConfigDir) {
        return expanduser(overrideConfigDir);
    }
    if (getConfigDirFromEnv()) {
        return expanduser(getConfigDirFromEnv()!);
    }
    return getDefaultConfigDir();
}

function resolvePaths(configDir: string) {
    const assistantBasePath =
        process.env.ASSISTANT_AI_BASE_PATH ||
        `${configDir}/base-path`;

    return {
        assistantBasePath,
        idea: `${assistantBasePath}/idea`,
        memory: `${assistantBasePath}/memory`,
        artifact: `${assistantBasePath}/artifact`,
    };
}

export function loadConfig(overrideConfigDir?: string): CloudyConfig {
    const configDir = resolveConfigDir(overrideConfigDir);
    const paths = resolvePaths(configDir);

    return {
        configDir,
        assistantBasePath: paths.assistantBasePath,
        ocApiBasePath: process.env.OC_API_BASE_PATH || "http://localhost:4096",
        dbDataDir: process.env.DB_DATA_DIR || `${configDir}/data`,
        dbDatabaseUrl:
            process.env.DB_DATABASE_URL || `file:${configDir}/data/local.db`,
        idea: paths.idea,
        memory: paths.memory,
        artifact: paths.artifact,
    };
}
