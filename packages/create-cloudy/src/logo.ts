import pc from "picocolors"

const LOGO = `
${pc.cyan("   ____ _                        _       _ _         ")}
${pc.cyan("  / ___| | __ _ ___ ___  ___  __| | __ _| | |        ")}
${pc.cyan(" | |   | |/ _` / __/ __|/ _ \\/ _` |/ _` | | |        ")}
${pc.cyan(" | |___| | (_| \\__ \\__ \\  __/ (_| | (_| | | |        ")}
${pc.cyan("  \\____|_|\\__,_|___/___/\\___|\\__,_|\\__,_|_|_|        ")}
${pc.dim("                                                      ")}
${pc.yellow("         ☁️  Your Personal AI Agent                   ")}
${pc.dim("                                                      ")}
`

export function showLogo(): void {
	console.log(LOGO)
	console.log(pc.dim("  Welcome! Let's set up your opencode project.\n"))
}
