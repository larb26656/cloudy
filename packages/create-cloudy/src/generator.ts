import { join } from "node:path"
import * as clack from "@clack/prompts"
import pc from "picocolors"
import { buildAgentsMd } from "./templates/agents-md"
import { buildMemoryMd } from "./templates/memory-md"
import { buildOpencodeJson } from "./templates/opencode-json"
import { buildSoulMd } from "./templates/soul-md"
import { buildUserMd } from "./templates/user-md"
import type { PromptAnswers } from "./prompts"
import { writeFile } from "./utils"

import skillIdeaToolUsage from "./templates/skills/idea-tool-usage.md?raw"
import skillMemory from "./templates/skills/memory.md?raw"
import skillArtifact from "./templates/skills/artifact.md?raw"

const skills: Record<string, string> = {
	"idea-tool-usage": skillIdeaToolUsage,
	memory: skillMemory,
	artifact: skillArtifact,
}

function loadSkill(name: string): string {
	const content = skills[name]
	if (!content) throw new Error(`Unknown skill: ${name}`)
	return content
}

interface GeneratedFile {
	path: string
	content: string
	label: string
}

function buildFiles(answers: PromptAnswers, targetDir: string): GeneratedFile[] {
	const files: GeneratedFile[] = [
		{
			path: join(targetDir, "AGENTS.md"),
			content: buildAgentsMd(),
			label: "AGENTS.md",
		},
		{
			path: join(targetDir, "SOUL.md"),
			content: buildSoulMd({ agentName: answers.agentName, language: answers.language }),
			label: "SOUL.md",
		},
		{
			path: join(targetDir, "USER.md"),
			content: buildUserMd({ userName: answers.userName, language: answers.language }),
			label: "USER.md",
		},
		{
			path: join(targetDir, "MEMORY.md"),
			content: buildMemoryMd(),
			label: "MEMORY.md",
		},
		{
			path: join(targetDir, "opencode.json"),
			content: buildOpencodeJson({ agentName: answers.agentName, includeSkill: answers.installSkill }),
			label: "opencode.json",
		},
	]

	files.push(
		{
			path: join(targetDir, "idea", ".gitkeep"),
			content: "",
			label: "idea/",
		},
		{
			path: join(targetDir, "artifact", ".gitkeep"),
			content: "",
			label: "artifact/",
		},
		{
			path: join(targetDir, "memory", ".gitkeep"),
			content: "",
			label: "memory/",
		},
	)

	if (answers.installSkill) {
		const skillNames = ["idea-tool-usage", "memory", "artifact"]
		for (const name of skillNames) {
			files.push({
				path: join(targetDir, ".opencode", "skills", name, "SKILL.md"),
				content: loadSkill(name),
				label: `.opencode/skills/${name}/SKILL.md`,
			})
		}
	}

	return files
}

export async function generate(answers: PromptAnswers, targetDir: string): Promise<void> {
	const files = buildFiles(answers, targetDir)
	const s = clack.spinner()

	s.start("Generating project files...")

	for (const file of files) {
		await writeFile(file.path, file.content)
		s.message(`Writing ${file.label}`)
	}

	s.stop("Files generated!")

	for (const file of files) {
		console.log(pc.green(`  ✔ ${file.label}`))
	}
}
