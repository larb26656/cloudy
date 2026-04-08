import { useEffect } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";

type SpeechBtnProps = {
  onTranscript?: (transcript: string) => void;
  onListeningChange?: (listening: boolean) => void;
};

export default function SpeechBtn({
  onTranscript,
  onListeningChange,
}: SpeechBtnProps) {
  const {
    interimTranscript,
    finalTranscript,
    listening,
    browserSupportsSpeechRecognition,
    resetTranscript,
  } = useSpeechRecognition();

  useEffect(() => {
    const liveTranscript = `${finalTranscript} ${interimTranscript}`.trim();
    onTranscript?.(liveTranscript);
  }, [interimTranscript, finalTranscript]);

  useEffect(() => {
    onListeningChange?.(listening);
  }, [listening, onListeningChange]);

  if (!browserSupportsSpeechRecognition) {
    return null;
  }

  const toggleListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());

      if (listening) {
        await SpeechRecognition.stopListening();
      } else {
        resetTranscript();
        await SpeechRecognition.startListening({
          language: "th-TH",
          continuous: true,
          interimResults: true,
        });
      }
    } catch (err) {
      console.error("toggleListening ERROR:", err);
    }
  };

  return (
    <Button
      size="icon"
      variant="ghost"
      className={`rounded-full p-4 relative overflow-visible${listening ? " bg-foreground text-background animate-pulse-shadow" : ""}`}
      onClick={toggleListening}
      title={listening ? "Stop speaking" : "Speak"}
    >
      {listening && (
        <>
          <span className="absolute inset-[-3px] rounded-full border border-foreground/40 animate-aura [animation-delay:0s]" />
          <span className="absolute inset-[-7px] rounded-full border border-foreground/25 animate-aura [animation-delay:0.5s]" />
          <span className="absolute inset-[-12px] rounded-full border border-foreground/15 animate-aura [animation-delay:1s]" />
        </>
      )}
      <Mic className="size-5 relative" />
    </Button>
  );
}
