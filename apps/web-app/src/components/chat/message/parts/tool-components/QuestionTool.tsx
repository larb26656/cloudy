import { HelpCircle } from "lucide-react";
import { ToolPreviewLabel } from "../ToolPreviewLabel";
import { ExpandableToolCard } from "./ExpandableToolCard";
import { ToolValueRenderer } from "./ToolValueRenderer";
import type { ToolComponentProps } from "./types";

export function QuestionTool({ state }: ToolComponentProps) {
  const input = state.input;
  const questions = input.questions as
    | Array<{
        question: string;
        header?: string;
        options?: Array<{ label: string; description: string }>;
      }>
    | undefined;

  const firstQuestion =
    questions && questions.length > 0 ? questions[0].question : null;

  return (
    <ExpandableToolCard
      tool="question"
      state={state}
      preview={
        <ToolPreviewLabel
          icon={<HelpCircle className="size-3" />}
          label={
            firstQuestion ? `Question: ${firstQuestion}` : "Asking question..."
          }
        />
      }
      detail={
        <div className="space-y-1.5 mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-300">
              <HelpCircle className="size-3" />
              <span>Question</span>
            </div>
          </div>
          {questions && questions.length > 0 ? (
            <div className="space-y-1">
              {questions.map((q, idx) => (
                <div key={idx} className="text-xs">
                  <div className="font-medium">{q.question}</div>
                  {q.header && (
                    <div className="text-muted-foreground text-[10px] uppercase">
                      {q.header}
                    </div>
                  )}
                  {q.options && q.options.length > 0 && (
                    <div className="mt-1 pl-2 border-l-2 border-amber-300 dark:border-amber-700">
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="py-0.5">
                          <span className="font-medium">•</span>{" "}
                          <span>{opt.label}</span>
                          {opt.description && (
                            <span className="text-muted-foreground">
                              {" "}
                              - {opt.description}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs">
              {Object.entries(input).map(([key, value]) => (
                <div key={key} className="py-0.5">
                  <span className="font-medium text-muted-foreground">
                    {key}:
                  </span>{" "}
                  <ToolValueRenderer value={value} keyName={key} />
                </div>
              ))}
            </div>
          )}
        </div>
      }
    />
  );
}
