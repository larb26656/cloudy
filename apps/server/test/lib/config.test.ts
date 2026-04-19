import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { camelToSnake, getEnvConfig } from "../../src/config/config";

describe("camelToSnake", () => {
    test("should_convert_camelCase_to_SCREAMING_SNAKE_CASE", () => {
        expect(camelToSnake("port")).toBe("PORT");
        expect(camelToSnake("dataDir")).toBe("DATA_DIR");
        expect(camelToSnake("configDir")).toBe("CONFIG_DIR");
        expect(camelToSnake("cors")).toBe("CORS");
        expect(camelToSnake("host")).toBe("HOST");
    });

    test("should_handle_single_uppercase_letter", () => {
        expect(camelToSnake("port")).toBe("PORT");
        expect(camelToSnake("host")).toBe("HOST");
    });

    test("should_handle_multiple_uppercase_letters", () => {
        expect(camelToSnake("dataDir")).toBe("DATA_DIR");
        expect(camelToSnake("someValue")).toBe("SOME_VALUE");
    });
});

describe("getEnvConfig", () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv };
        delete process.env.CLOUDY_PORT;
        delete process.env.CLOUDY_DATA_DIR;
        delete process.env.CLOUDY_UI;
        delete process.env.CLOUDY_HOST;
        delete process.env.CLOUDY_CONFIG_DIR;
        delete process.env.CLOUDY_CORS;
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    test("should_return_CLOUDY_PORT_from_env", () => {
        // Arrange
        process.env.CLOUDY_PORT = "3001";

        // Act
        const config = getEnvConfig();

        // Assert
        expect(config.port).toBe("3001");
    });

    test("should_return_CLOUDY_DATA_DIR_from_env", () => {
        // Arrange
        process.env.CLOUDY_DATA_DIR = "/app/data";

        // Act
        const config = getEnvConfig();

        // Assert
        expect(config.dataDir).toBe("/app/data");
    });

    test("should_return_CLOUDY_UI_from_env", () => {
        // Arrange
        process.env.CLOUDY_UI = "true";

        // Act
        const config = getEnvConfig();

        // Assert
        expect(config.ui as unknown).toBe("true");
    });

    test("should_return_undefined_for_missing_env_vars", () => {
        // Act
        const config = getEnvConfig();

        // Assert
        expect(config.port).toBeUndefined();
        expect(config.dataDir).toBeUndefined();
        expect(config.ui).toBeUndefined();
    });

    test("should_map_all_camelCase_keys_to_SCREAMING_SNAKE_CASE_env_vars", () => {
        // Arrange
        process.env.CLOUDY_CONFIG_DIR = "/custom/config";
        process.env.CLOUDY_HOST = "0.0.0.0";
        process.env.CLOUDY_CORS = "localhost:3000";

        // Act
        const config = getEnvConfig();

        // Assert
        expect(config.configDir).toBe("/custom/config");
        expect(config.host).toBe("0.0.0.0");
        expect(config.cors).toBe("localhost:3000");
    });
});
