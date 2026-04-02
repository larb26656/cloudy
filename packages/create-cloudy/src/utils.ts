import { existsSync } from "node:fs"
import { mkdir, writeFile as fsWriteFile } from "node:fs/promises"
import { dirname, isAbsolute, resolve } from "node:path"

export function resolveTargetDir(dir?: string): string {
	if (!dir) return process.cwd()
	return isAbsolute(dir) ? dir : resolve(process.cwd(), dir)
}

export async function ensureDir(filePath: string): Promise<void> {
	const dir = dirname(filePath)
	if (!existsSync(dir)) {
		await mkdir(dir, { recursive: true })
	}
}

export async function writeFile(path: string, content: string): Promise<void> {
	await ensureDir(path)
	await fsWriteFile(path, content, "utf-8")
}
