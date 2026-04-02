import { readFileSync } from "node:fs"
import { join } from "node:path"
import * as clack from "@clack/prompts"
import pc from "picocolors"
import { buildAgentsMd } from "./templates/agents-md"
import { buildEnvExample } from "./templates/env-example"
import { buildMemoryMd } from "./templates/memory-md"
import { buildOpencodeJson } from "./templates/opencode-json"
import { buildSoulMd } from "./templates/soul-md"
import { buildUserMd } from "./templates/user-md"
import type { PromptAnswers } from "./prompts"
import { writeFile } from "./utils"

const SKILLS_DIR = join(import.meta.dir, "templates", "skills")

function loadSkill(name: string): string {
	return readFileSync(join(SKILLS_DIR, `${name}.md`), "utf-8")
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
		{
			path: join(targetDir, ".env.example"),
			content: buildEnvExample(),
			label: ".env.example",
		},
	]

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
