export interface UserMdVars {
	userName: string
	language: string
}

export function buildUserMd(vars: UserMdVars): string {
	return `# USER.md

**Name:** ${vars.userName}
**Language:** ${vars.language}

---
`
}
