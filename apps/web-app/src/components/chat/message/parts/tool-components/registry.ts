import type { ComponentType } from "react";
import type { ToolComponentProps } from "./types";
import { BashTool } from "./BashTool";
import { ReadTool } from "./ReadTool";
import { WriteTool } from "./WriteTool";
import { EditTool } from "./EditTool";
import { GrepTool } from "./GrepTool";
import { GlobTool } from "./GlobTool";
import { WebTool } from "./WebTool";
import { QuestionTool } from "./QuestionTool";
import { SkillTool } from "./SkillTool";
import { TaskTool } from "./TaskTool";
import { TodoTool } from "./TodoTool";
import { DefaultTool } from "./DefaultTool";

const toolRegistry: Record<string, ComponentType<ToolComponentProps>> = {
  bash: BashTool,
  read: ReadTool,
  write: WriteTool,
  edit: EditTool,
  grep: GrepTool,
  glob: GlobTool,
  webfetch: WebTool,
  websearch: WebTool,
  question: QuestionTool,
  skill: SkillTool,
  task: TaskTool,
  todowrite: TodoTool,
};

export function getToolComponent(
  tool: string,
): ComponentType<ToolComponentProps> {
  return toolRegistry[tool] ?? DefaultTool;
}
