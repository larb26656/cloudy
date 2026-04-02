export interface OpencodeJsonVars {
	agentName: string
	includeSkill: boolean
}

export function buildOpencodeJson(vars: OpencodeJsonVars): string {
	const config: Record<string, unknown> = {
		$schema: "https://opencode.ai/config.json",
		instructions: ["AGENTS.md", "SOUL.md", "USER.md"],
		plugin: ["@cloudy-app/opencode-plugin"]
	}

	if (vars.includeSkill) {
		config.skills = {
			paths: [".opencode/skills"],
		}
	}

	return JSON.stringify(config, null, 2) + "\n"
}
