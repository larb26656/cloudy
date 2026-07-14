"use client";

import { useState, useCallback } from "react";
import { HelpCircle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useReplyQuestion, useRejectQuestion } from "@/hooks/queries/useQuestions";
import type { QuestionV2Request, QuestionV2Reply, QuestionAnswer } from "@opencode-ai/sdk/v2";

interface QuestionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questions: QuestionV2Request[];
  sessionID: string;
}

export function QuestionSheet({
  open,
  onOpenChange,
  questions,
  sessionID,
}: QuestionSheetProps) {
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);

  const replyQuestion = useReplyQuestion();
  const rejectQuestion = useRejectQuestion();

  const isPending = replyQuestion.isPending || rejectQuestion.isPending;

  const resetState = useCallback(() => {
    setAnswers({});
    setCustomValues({});
    setActiveRequestId(null);
  }, []);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetState();
    }
    onOpenChange(newOpen);
  };

  const activeQuestion = questions.find((q) => q.id === activeRequestId) ?? questions[0] ?? null;

  const handleReply = async () => {
    if (!activeQuestion) return;

    const answerList: Array<QuestionAnswer> = activeQuestion.questions.map((q, idx) => {
      const key = `${activeQuestion.id}-${idx}`;
      const selected = answers[key] ?? [];
      const custom = customValues[key]?.trim();
      if (custom && q.custom) {
        return [...selected, custom];
      }
      return selected;
    });

    await replyQuestion.mutateAsync({
      requestID: activeQuestion.id,
      answers: answerList,
    });

    resetState();
    if (questions.length <= 1) {
      onOpenChange(false);
    }
  };

  const handleReject = async () => {
    if (!activeQuestion) return;

    await rejectQuestion.mutateAsync({
      requestID: activeQuestion.id,
    });

    resetState();
    if (questions.length <= 1) {
      onOpenChange(false);
    }
  };

  const toggleOption = (
    requestId: string,
    questionIdx: number,
    label: string,
    multiple: boolean
  ) => {
    const key = `${requestId}-${questionIdx}`;
    setAnswers((prev) => {
      const current = prev[key] ?? [];
      if (multiple) {
        const newValue = current.includes(label)
          ? current.filter((l) => l !== label)
          : [...current, label];
        return { ...prev, [key]: newValue };
      }
      return { ...prev, [key]: [label] };
    });
  };

  const isValid =
    activeQuestion?.questions.every((q, idx) => {
      const key = `${activeQuestion.id}-${idx}`;
      const selected = answers[key] ?? [];
      const hasSelection =
        selected.length > 0 || (q.custom && customValues[key]?.trim());
      return hasSelection;
    }) ?? false;

  if (!activeQuestion) return null;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="max-w-lg mx-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <HelpCircle className="size-4 text-amber-600" />
            Question {questions.indexOf(activeQuestion) + 1} of {questions.length}
          </SheetTitle>
          <SheetDescription>
            Answer the question below to continue.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="max-h-[60vh] my-4">
          <div className="space-y-4 p-1">
            {activeQuestion.questions.map((q, idx) => {
              const key = `${activeQuestion.id}-${idx}`;
              return (
                <div
                  key={idx}
                  className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg space-y-3"
                >
                  <div>
                    <div className="text-xs font-medium text-amber-700 dark:text-amber-300 uppercase mb-1">
                      {q.header}
                    </div>
                    <div className="font-medium text-sm">{q.question}</div>
                  </div>

                  {q.multiple ? (
                    <div className="space-y-2 pl-2 border-l-2 border-amber-300 dark:border-amber-700">
                      {q.options.map((opt, optIdx) => {
                        const selected = answers[key] ?? [];
                        const isChecked = selected.includes(opt.label);
                        return (
                          <label
                            key={optIdx}
                            className="flex items-start gap-2 cursor-pointer"
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() =>
                                toggleOption(activeQuestion.id, idx, opt.label, true)
                              }
                              disabled={isPending}
                            />
                            <div className="flex-1">
                              <span className="text-sm font-medium">
                                {opt.label}
                              </span>
                              {opt.description && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  — {opt.description}
                                </span>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <RadioGroup
                      value={answers[key]?.[0] ?? ""}
                      onValueChange={(val) =>
                        toggleOption(activeQuestion.id, idx, val, false)
                      }
                      disabled={isPending}
                      className="space-y-2 pl-2 border-l-2 border-amber-300 dark:border-amber-700"
                    >
                      {q.options.map((opt, optIdx) => (
                        <label
                          key={optIdx}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <RadioGroupItem value={opt.label} />
                          <div>
                            <span className="text-sm font-medium">
                              {opt.label}
                            </span>
                            {opt.description && (
                              <span className="text-xs text-muted-foreground ml-1">
                                — {opt.description}
                              </span>
                            )}
                          </div>
                        </label>
                      ))}
                    </RadioGroup>
                  )}

                  {q.custom && (
                    <Input
                      placeholder="Type your answer..."
                      value={customValues[key] ?? ""}
                      onChange={(e) =>
                        setCustomValues((prev) => ({
                          ...prev,
                          [key]: e.target.value,
                        }))
                      }
                      disabled={isPending}
                      className="mt-2"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <SheetFooter>
          <div className="flex gap-2 w-full">
            <Button
              variant="ghost"
              onClick={handleReject}
              disabled={isPending}
              className="flex-1"
            >
              Reject
            </Button>
            <Button
              variant="default"
              onClick={handleReply}
              disabled={isPending || !isValid}
              className="flex-1"
            >
              {isPending ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
