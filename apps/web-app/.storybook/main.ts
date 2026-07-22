import type { StorybookConfig } from '@storybook/tanstack-react';

import { dirname } from "path"

import { fileURLToPath } from "url"

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string) {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)))
}
const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    getAbsolutePath('@chromatic-com/storybook'),
    getAbsolutePath('@storybook/addon-vitest'),
    getAbsolutePath('@storybook/addon-a11y'),
    getAbsolutePath('@storybook/addon-docs')
  ],
  // Use a bare specifier (not getAbsolutePath) for the framework: @storybook/tanstack-react
  // ships its preset only under dist/preset.js, reachable via the package "exports" map.
  // Storybook resolves `<framework>/preset`, and Node only consults the exports map for
  // bare specifiers, not for absolute paths. Addons work with getAbsolutePath because
  // they ship a root-level preset.js; this framework package does not.
  "framework": "@storybook/tanstack-react"
};
export default config;