import { useQuestionStore } from "@cloudy/core-chat";
import { Button } from "@/components/ui/button";
import { MessageCircleQuestion, XIcon } from "lucide-react";

interface QuestionBannerProps {
  onOpenDialog: () => void;
}

export function QuestionBanner({ onOpenDialog }: QuestionBannerProps) {
  const { questions, dismissed, dismissNotification } = useQuestionStore();

  const questionCount = Object.values(questions).flat().length;

  if (dismissed || questionCount === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
      <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
        <MessageCircleQuestion className="w-4 h-4" />
        <span className="text-sm font-medium">
          {questionCount} pending question{questionCount !== 1 ? "s" : ""} waiting for your response
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/40"
          onClick={onOpenDialog}
        >
          View Questions
        </Button>
        <Button
          size="icon-xs"
          variant="ghost"
          className="text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/40"
          onClick={dismissNotification}
        >
          <XIcon className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}
