import { useState } from "react";
import { useStore } from "@/stores/instance";
import { useWorkspaceStore } from "@/stores/workspaceStore.new";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { MessageCircleQuestion, Trash2, SendHorizontal } from "lucide-react";

interface QuestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuestionDialog({ open, onOpenChange }: QuestionDialogProps) {
  const { questions, rejectQuestion } = useStore("question");
  const { setActiveQuestion, sessions } = useStore("session");
  const selectedDirectory = useWorkspaceStore().getCurrentWorkspace()?.directory;
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const questionList = Object.entries(questions);

  const handleSelectSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
  };

  const handleAnswer = () => {
    if (!selectedSessionId) return;

    const sessionQuestions = questions[selectedSessionId];
    if (!sessionQuestions || sessionQuestions.length === 0) return;

    const question = sessionQuestions[0];
    setActiveQuestion(question);
    onOpenChange(false);
    setSelectedSessionId(null);
  };

  const handleReject = async (requestId: string) => {
    if (!selectedDirectory) return;

    setIsSubmitting(true);
    await rejectQuestion(requestId, selectedDirectory);
    setIsSubmitting(false);

    const remaining = questions[selectedSessionId!];
    if (!remaining || remaining.length === 0) {
      setSelectedSessionId(null);
    }
  };

  const currentQuestions = selectedSessionId ? questions[selectedSessionId] : null;
  const session = selectedSessionId
    ? sessions.find((s) => s.id === selectedSessionId)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Pending Questions</DialogTitle>
          <DialogDescription>
            Select a session to answer questions from the AI assistant
          </DialogDescription>
        </DialogHeader>

        {!selectedSessionId ? (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {questionList.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No pending questions
                </p>
              ) : (
                questionList.map(([sessionId, sessionQuestions]) => (
                  <button
                    key={sessionId}
                    onClick={() => handleSelectSession(sessionId)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-lg border transition-colors",
                      "hover:bg-muted hover:border-muted-foreground/20",
                      "text-left"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <MessageCircleQuestion className="w-4 h-4 text-amber-500" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium line-clamp-1">
                          {sessionQuestions[0].questions[0]?.header || "Question"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {sessionQuestions.length} question{sessionQuestions.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSelectedSessionId(null)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← Back to sessions
              </button>
              {session && (
                <span className="text-xs text-muted-foreground">
                  {session.title}
                </span>
              )}
            </div>

            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-3">
                {currentQuestions?.map((q) => (
                  <div
                    key={q.id}
                    className="p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="flex items-start gap-2">
                      <MessageCircleQuestion className="w-4 h-4 text-amber-500 mt-0.5" />
                      <div className="flex-1 min-w-0 space-y-2">
                        {q.questions.map((questionInfo, qIdx) => (
                          <div key={qIdx}>
                            <p className="text-sm font-medium mb-1">{questionInfo.question}</p>
                            {questionInfo.options.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {questionInfo.options.map((option, optIdx) => (
                                  <span
                                    key={optIdx}
                                    className="px-2 py-0.5 text-xs rounded-full bg-secondary"
                                  >
                                    {option.label}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleReject(currentQuestions![0].id)}
                disabled={isSubmitting}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Skip
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={handleAnswer}
                disabled={!currentQuestions || currentQuestions.length === 0}
              >
                <SendHorizontal className="w-4 h-4 mr-1" />
                Answer
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
