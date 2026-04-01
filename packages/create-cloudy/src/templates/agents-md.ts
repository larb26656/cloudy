export interface AgentsMdVars {
	agentName: string
}

export function buildAgentsMd(vars: AgentsMdVars): string {
	return `# Project Instructions

This file contains instructions for ${vars.agentName} when working with this project.

## Commands

\`\`\`bash
# Install dependencies
bun install

# Run in development mode
bun run dev

# Lint code
bun run lint

# Fix lint issues
bun run lint:write
\`\`\`

## Code Style

- Use strict TypeScript
- Follow existing naming conventions in the codebase
- One major component/type per file
- Use index files for public exports

## File Conventions

- Files: \`kebab-case\`, \`PascalCase.tsx\` for React components
- Variables/functions: \`camelCase\`
- Types/interfaces: \`PascalCase\`
- Constants: \`SCREAMING_SNAKE_CASE\` for config, \`camelCase\` for runtime

## Important Rules

1. Always read existing code before making changes
2. Follow established patterns in the codebase
3. Never commit secrets or API keys
4. Run lint before considering a task complete
5. Write meaningful commit messages
`
}
