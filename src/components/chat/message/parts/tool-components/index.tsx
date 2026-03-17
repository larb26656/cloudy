import type { ToolPart as ToolPartType } from "@opencode-ai/sdk/v2";
import { Detail as BashDetail, Preview as BashPreview } from "./BashToolInput";
import { Detail as ReadDetail, Preview as ReadPreview } from "./ReadToolInput";
import { Detail as WriteDetail, Preview as WritePreview } from "./WriteToolInput";
import { Detail as EditDetail, Preview as EditPreview } from "./EditToolInput";
import { Detail as GrepDetail, Preview as GrepPreview } from "./GrepToolInput";
import { Detail as GlobDetail, Preview as GlobPreview } from "./GlobToolInput";
import { Detail as WebDetail, Preview as WebPreview } from "./WebToolInput";
import { Detail as QuestionDetail, Preview as QuestionPreview } from "./QuestionToolInput";
import { Detail as SkillDetail, Preview as SkillPreview } from "./SkillToolInput";
import { Detail as DefaultDetail, Preview as DefaultPreview } from "./DefaultToolInput";

interface ToolComponentProps {
  tool: string;
  state: ToolPartType["state"];
}

export function Preview({ tool, state }: ToolComponentProps) {
  switch (tool) {
    case "bash":
      return <BashPreview state={state} />;
    case "read":
      return <ReadPreview state={state} />;
    case "write":
      return <WritePreview state={state} />;
    case "edit":
      return <EditPreview state={state} />;
    case "grep":
      return <GrepPreview state={state} />;
    case "glob":
      return <GlobPreview state={state} />;
    case "webfetch":
    case "websearch":
      return <WebPreview tool={tool} state={state} />;
    case "question":
      return <QuestionPreview state={state} />;
    case "skill":
      return <SkillPreview state={state} />;
    default:
      return <DefaultPreview tool={tool} state={state} />;
  }
}

export function Detail({ tool, state }: ToolComponentProps) {
  switch (tool) {
    case "bash":
      return <BashDetail input={state.input} />;
    case "read":
      return <ReadDetail input={state.input} />;
    case "write":
      return <WriteDetail input={state.input} />;
    case "edit":
      return <EditDetail input={state.input} />;
    case "grep":
      return <GrepDetail input={state.input} />;
    case "glob":
      return <GlobDetail input={state.input} />;
    case "webfetch":
    case "websearch":
      return <WebDetail tool={tool} input={state.input} />;
    case "question":
      return <QuestionDetail input={state.input} state={state} />;
    case "skill":
      return <SkillDetail input={state.input} />;
    default:
      return <DefaultDetail input={state.input} />;
  }
}

export { ToolValueRenderer } from "./ToolValueRenderer";
