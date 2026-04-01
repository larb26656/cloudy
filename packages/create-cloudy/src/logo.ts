import pc from "picocolors"

function makeText(): string {
	return pc.cyan([
		"  .oooooo.   oooo                              .o8             ",
		" d8P'  `Y8b  `888                             \"888             ",
		"888           888   .ooooo.  oooo  oooo   .oooo888  oooo    ooo",
		"888           888  d88' `88b `888  `888  d88' `888   `88.  .8' ",
		"888           888  888   888  888   888  888   888    `88..8'  ",
		"`88b    ooo   888  888   888  888   888  888   888     `888'   ",
		" `Y8bood8P'  o888o `Y8bod8P'  `V88V\"V8P' `Y8bod88P\"     .8'    ",
		"                                                    .o..P'     ",
		"                                                    `Y8P'      ",
	].join("\n"))
}

export function showLogo(): void {
	console.log()
	console.log(makeText())
	console.log()
	console.log(pc.yellow(`              ${pc.bold("Cloudy")} - Your Personal AI Agent`))
	console.log(pc.dim("  Welcome! Let's set up your opencode project.\n"))
}
