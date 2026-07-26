import { MessageCircleQuestion } from "lucide-react";

interface QuestionBannerProps {
  onOpenDialog: () => void;
  count: number;
}

export function QuestionBanner({ onOpenDialog, count }: QuestionBannerProps) {
  if (count === 0) return null;

  return (
    <button
      onClick={onOpenDialog}
      className="px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-xs font-medium rounded-full shadow-md hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors flex items-center gap-1.5"
    >
      <MessageCircleQuestion size={16} />
      {count}
    </button>
  );
}
