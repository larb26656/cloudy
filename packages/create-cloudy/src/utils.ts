import { existsSync } from "node:fs"
import { mkdir } from "node:fs/promises"
import { dirname, resolve } from "node:path"

export function resolveTargetDir(dir?: string): string {
	const target = dir ? resolve(dir) : process.cwd()
	return target
}

export async function ensureDir(filePath: string): Promise<void> {
	const dir = dirname(filePath)
	if (!existsSync(dir)) {
		await mkdir(dir, { recursive: true })
	}
}

export async function writeFile(path: string, content: string): Promise<void> {
	await ensureDir(path)
	await Bun.write(path, content)
}
