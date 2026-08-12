"use client";

import { useState, useCallback, useEffect } from "react";
import { HelpCircle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  useReplyQuestion,
  useRejectQuestion,
} from "@/hooks/queries/useQuestions";
import type { QuestionAnswer, QuestionV2Request } from "@opencode-ai/sdk/v2";
import { CheckboxOptionList } from "./CheckboxOptionList";
import { RadioOptionList } from "./RadioOptionList";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field } from "../ui/field";
import { toast } from "@/components/ui/sonner";

const OTHER_VALUE = "other";

const singleAnswerSchema = z.object({
  type: z.literal("single"),
  value: z.string().min(1, "Please select an answer"),
  otherText: z.string().optional(),
});

const multipleAnswerSchema = z.object({
  type: z.literal("multiple"),
  values: z.array(z.string()).min(1, "Please select at least 1 option"),
  otherText: z.string().optional(),
});

const answerSchema = z.discriminatedUnion("type", [
  singleAnswerSchema,
  multipleAnswerSchema,
]);

export const questionFormSchema = z
  .object({
    answers: z.array(answerSchema),
  })
  .superRefine((data, ctx) => {
    for (const answer of data.answers) {
      if (
        answer.type === "single" &&
        answer.value === OTHER_VALUE &&
        !answer.otherText?.trim()
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please specify",
          path: ["answers", data.answers.indexOf(answer), "otherText"],
        });
      }
      if (
        answer.type === "multiple" &&
        answer.values.includes(OTHER_VALUE) &&
        !answer.otherText?.trim()
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please specify",
          path: ["answers", data.answers.indexOf(answer), "otherText"],
        });
      }
    }
  });

export type QuestionFormValues = z.infer<typeof questionFormSchema>;

interface QuestionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: QuestionV2Request;
  directory: string;
}

export function QuestionSheet({
  open,
  onOpenChange,
  question,
  directory,
}: QuestionSheetProps) {
  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      answers: [],
    },
  });

  const [step, setStep] = useState<number>(0);

  const replyQuestion = useReplyQuestion();
  const rejectQuestion = useRejectQuestion();

  const isPending = replyQuestion.isPending || rejectQuestion.isPending;

  const currentQuestion = question.questions[step];
  const isLastStep = step === question.questions.length - 1;
  const isMultiple = currentQuestion.multiple;

  const resetState = useCallback(() => {
    setStep(0);
    const initialAnswers: QuestionFormValues["answers"] =
      question.questions.map((q) =>
        q.multiple
          ? { type: "multiple" as const, values: [] as string[], otherText: "" }
          : { type: "single" as const, value: "" as string, otherText: "" },
      );
    form.reset({ answers: initialAnswers });
  }, [question, form]);

  useEffect(() => {
    if (open) {
      resetState();
    }
  }, [open, resetState]);

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
  };

  const handleReply = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    const answerList: Array<QuestionAnswer> = form
      .getValues()
      .answers.map((answer) => {
        if (answer.type === "single") {
          return [answer.otherText || answer.value];
        }

        const values = answer.values.filter((value) => value !== "other");

        return answer.otherText ? [...values, answer.otherText] : answer.values;
      });

    try {
      await replyQuestion.mutateAsync({
        requestID: question.id,
        directory,
        answers: answerList,
      });
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to submit answer",
      );
    }
  };

  const handleReject = async () => {
    try {
      await rejectQuestion.mutateAsync({
        requestID: question.id,
        directory,
      });
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to reject question",
      );
    }
  };

  const handleBack = (): void => {
    setStep((prev) => prev - 1);
  };

  const handleNext = async (): Promise<void> => {
    const isValid = await form.trigger(`answers.${step}`);
    if (!isValid) return;
    setStep((prev) => prev + 1);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="max-w-lg mx-auto rounded-t-xl max-h-dvh"
      >
        <SheetHeader className="shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <HelpCircle className="size-4 text-amber-600" />
            Question {step + 1} of {question.questions.length}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 min-h-0 overflow-y-auto space-y-4 p-1">
          <div className="p-3 space-y-3">
            <div className="mb-5">
              <div className="font-medium uppercase mb-1">
                {currentQuestion.header}
              </div>
              <div className="font-medium text-sm text-muted-foreground">
                {currentQuestion.question}
              </div>
            </div>

            <Field data-invalid={!!form.formState.errors.answers?.[step]}>
              {isMultiple ? (
                <CheckboxOptionList
                  control={form.control}
                  name={`answers.${step}`}
                  options={currentQuestion.options}
                  disabled={isPending}
                />
              ) : (
                <RadioOptionList
                  control={form.control}
                  name={`answers.${step}`}
                  options={currentQuestion.options}
                  disabled={isPending}
                />
              )}
            </Field>
          </div>
        </div>

        <SheetFooter className="shrink-0">
          <div className="flex gap-2 w-full">
            {step === 0 ? (
              <Button
                variant="ghost"
                onClick={handleReject}
                disabled={isPending}
                className="flex-1"
              >
                Reject
              </Button>
            ) : (
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={isPending}
                className="flex-1"
              >
                Back
              </Button>
            )}

            {!isLastStep ? (
              <Button
                variant="default"
                onClick={handleNext}
                disabled={isPending}
                className="flex-1"
              >
                Next
              </Button>
            ) : (
              <Button
                variant="default"
                onClick={handleReply}
                disabled={isPending}
                className="flex-1"
              >
                {isPending ? "Submitting..." : "Submit"}
              </Button>
            )}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
