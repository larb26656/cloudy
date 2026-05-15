export interface ParsedCommand {
    command: string;
    arguments: string;
}
export declare function isCommand(input: string): boolean;
export declare function parseCommand(input: string): ParsedCommand | null;
