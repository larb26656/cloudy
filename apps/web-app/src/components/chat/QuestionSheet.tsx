import { useState } from "react";
import { HelpCircle, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useStore } from "@/stores/instance";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface QuestionSheetProps {
  open: boolean;
}

export function QuestionSheet({ open }: QuestionSheetProps) {
  const { activeQuestion, clearActiveQuestion } = useStore("session");
  const { replyQuestion, rejectQuestion } = useStore("question");
  const { selectedDirectory } = useStore("directory");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const [customText, setCustomText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open || !activeQuestion) return null;

  const questions = activeQuestion.questions;
  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const isFirstQuestion = currentIndex === 0;
  const currentAnswer = answers[currentIndex] || [];
  const hasCustom = currentQuestion.custom !== false;

  const handleSelectOption = (label: string) => {
    if (currentQuestion.multiple) {
      const newAnswers = currentAnswer.includes(label)
        ? currentAnswer.filter((a) => a !== label)
        : [...currentAnswer, label];
      setAnswers({ ...answers, [currentIndex]: newAnswers });
    } else {
      setAnswers({ ...answers, [currentIndex]: [label] });
    }
  };

  const handleCustomText = () => {
    if (customText.trim()) {
      setAnswers({ ...answers, [currentIndex]: [customText.trim()] });
    }
  };

  const handleNext = () => {
    if (!isLastQuestion) {
      setCurrentIndex(currentIndex + 1);
      setCustomText("");
    }
  };

  const handlePrevious = () => {
    if (!isFirstQuestion) {
      setCurrentIndex(currentIndex - 1);
      setCustomText("");
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const finalAnswers = questions.map((_, idx) => answers[idx] || []);
      await replyQuestion(
        activeQuestion.id,
        finalAnswers as [string, ...string[]][],
        selectedDirectory!
      );
      clearActiveQuestion();
      setAnswers({});
      setCurrentIndex(0);
      setCustomText("");
    } catch (error) {
      console.error("Failed to submit answer:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    try {
      await rejectQuestion(activeQuestion.id, selectedDirectory!);
      clearActiveQuestion();
      setAnswers({});
      setCurrentIndex(0);
      setCustomText("");
    } catch (error) {
      console.error("Failed to reject question:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed =
    currentAnswer.length > 0 || (hasCustom && customText.trim().length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative w-full max-w-lg bg-background rounded-t-lg shadow-lg animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium">
              Question {currentIndex + 1} of {questions.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReject}
              disabled={isSubmitting}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {currentQuestion.header && (
            <div className="text-xs text-muted-foreground uppercase tracking-wide">
              {currentQuestion.header}
            </div>
          )}

          <div className="text-sm font-medium">{currentQuestion.question}</div>

          {currentQuestion.options && currentQuestion.options.length > 0 && (
            <div className="space-y-2">
              {currentQuestion.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(option.label)}
                  className={`w-full text-left p-3 rounded-md border transition-colors ${
                    currentAnswer.includes(option.label)
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <div className="text-sm font-medium">{option.label}</div>
                  {option.description && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {option.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {hasCustom && (
            <div className="space-y-2">
              <Textarea
                placeholder="Or type your own answer..."
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                onBlur={handleCustomText}
                className="min-h-[80px]"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-4 border-t bg-muted/50">
          <Button
            variant="ghost"
            onClick={handlePrevious}
            disabled={isFirstQuestion}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>

          {isLastQuestion ? (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed || isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={!canProceed}>
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
