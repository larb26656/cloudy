import * as clack from "@clack/prompts"
import pc from "picocolors"
import { generate } from "./generator"
import { showLogo } from "./logo"
import type { PromptAnswers } from "./prompts"
import { runPrompts } from "./prompts"
import { resolveTargetDir } from "./utils"

function parseArgs(args: string[]): { yes: boolean; dir?: string } {
	let yes = false
	let dir: string | undefined
	for (const arg of args) {
		if (arg === "--yes" || arg === "-y") yes = true
		else if (arg.startsWith("--dir=")) dir = arg.slice("--dir=".length)
		else if (arg === "--dir" || arg === "-d") {
			const idx = args.indexOf(arg)
			const next = args[idx + 1]
			if (next && !next.startsWith("-")) dir = next
		}
	}
	return { yes, dir }
}

const DEFAULT_ANSWERS: PromptAnswers = {
	agentName: "Cloudy",
	userName: "Developer",
	language: "ไทย",
	installSkill: true,
}

async function main(): Promise<void> {
	const { yes, dir } = parseArgs(process.argv.slice(2))
	const targetDir = resolveTargetDir(dir)

	showLogo()

	const answers = yes ? DEFAULT_ANSWERS : await runPrompts()

	if (!answers) {
		return
	}

	console.log()
	await generate(answers, targetDir)
	console.log()

	clack.note(
		[
			"Your opencode project config is ready!",
			"",
			"Next steps:",
			"  1. Review opencode.json and customize",
			"  2. Edit SOUL.md to match your agent personality",
			"  3. Run opencode to start chatting with your agent",
		].join("\n"),
		pc.cyan("Done!"),
	)

	console.log(pc.dim(`\n  Generated in: ${targetDir}\n`))
}

main().catch((err) => {
	clack.cancel(`Something went wrong: ${err instanceof Error ? err.message : String(err)}`)
	process.exit(1)
})
