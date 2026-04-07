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
  const { transcript, listening, browserSupportsSpeechRecognition } =
    useSpeechRecognition();

  useEffect(() => {
    console.log("SpeechRecognition exists:", !!window.SpeechRecognition);
    console.log(
      "webkitSpeechRecognition exists:",
      !!window.webkitSpeechRecognition,
    );
    console.log(
      "browserSupportsSpeechRecognition:",
      browserSupportsSpeechRecognition,
    );
  }, [browserSupportsSpeechRecognition]);

  useEffect(() => {
    if (transcript && onTranscript) {
      onTranscript(transcript);
    }
  }, [transcript, onTranscript]);

  useEffect(() => {
    onListeningChange?.(listening);
  }, [listening, onListeningChange]);

  if (!browserSupportsSpeechRecognition) {
    return null;
  }

  const toggleListening = async () => {
    console.log("=== TOGGLE CLICKED ===");
    console.log("before listening:", listening);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("mic permission granted");
      stream.getTracks().forEach((track) => track.stop());

      if (listening) {
        console.log("calling stopListening()");
        await SpeechRecognition.stopListening();
        console.log("stopListening done");
      } else {
        console.log("calling startListening()");
        await SpeechRecognition.startListening({
          language: "th-TH",
          continuous: true,
          interimResults: true,
        });
        console.log("startListening done");
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
