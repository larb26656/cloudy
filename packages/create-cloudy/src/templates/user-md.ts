export interface UserMdVars {
	userName: string
	language: string
}

export function buildUserMd(vars: UserMdVars): string {
	return `# User Profile

## Basic Info

- **Name:** ${vars.userName}
- **Preferred Language:** ${vars.language}

## Preferences

- When giving explanations, use **${vars.language}**
- Code comments should be in English (industry standard)
- Commit messages should be in English
- Documentation files (like this one) can be in ${vars.language}

## Notes

Edit this file to add more preferences about yourself so your AI agent can serve you better.
`
}
