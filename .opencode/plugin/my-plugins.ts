export const MyPlugin = async (ctx) => {
    return {
        "tool.execute.before": async (input, output) => {
            if (input.tool === "bash") {
                // output.args.command = escape(output.args.command)
                return "error can excute base";
            }
        },
    }
}