import * as clack from "@clack/prompts"

export interface PromptAnswers {
	agentName: string
	userName: string
	language: string
	installSkill: boolean
}

export async function runPrompts(): Promise<PromptAnswers | null> {
	const group = await clack.group(
		{
			agentName: () =>
				clack.text({
					message: "What should your agent be named?",
					placeholder: "Cloudy",
					defaultValue: "Cloudy",
				}),
			userName: () =>
				clack.text({
					message: "What is your name?",
					placeholder: "Your name",
					validate: (v: string) => {
						if (!v.trim()) return "Please enter your name"
					},
				}),
			language: () =>
				clack.text({
					message: "What language should I speak?",
					placeholder: "ไทย",
					defaultValue: "ไทย",
				}),
			installSkill: () =>
				clack.confirm({
					message: "Include idea-tool-usage skill?",
					initialValue: true,
				}),
		},
		{
			onCancel: () => {
				clack.cancel("Setup cancelled.")
				process.exit(0)
			},
		},
	)

	if (clack.isCancel(group.agentName) || clack.isCancel(group.userName) || clack.isCancel(group.language) || clack.isCancel(group.installSkill)) {
		return null
	}

	return {
		agentName: group.agentName as string,
		userName: group.userName as string,
		language: group.language as string,
		installSkill: group.installSkill as boolean,
	}
}
