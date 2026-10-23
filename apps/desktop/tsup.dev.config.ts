import { defineConfig } from "tsup";
import { desktopTsupConfig } from "./tsup.config";

export default defineConfig({ ...desktopTsupConfig, clean: false });
