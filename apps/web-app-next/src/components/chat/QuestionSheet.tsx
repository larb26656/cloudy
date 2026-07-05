interface QuestionSheetProps {
  open: boolean;
}

export function QuestionSheet({ open }: QuestionSheetProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
      <div className="relative w-full max-w-lg bg-background rounded-t-lg shadow-lg p-4 pointer-events-auto">
        <p className="text-sm text-muted-foreground">
          No active question (mock).
        </p>
      </div>
    </div>
  );
}
