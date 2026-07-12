import { ChatContainer } from "@/components/chat/ChatContainer";

export function DeskPage() {
  return (
    <div className="flex gap-2 h-full">
      <div className="flex-1 h-full">
        <ChatContainer sessionId={"ses_0cd1ecaf1ffew1jgOKkebREFHa"} />
      </div>
      <div className="flex-1 h-full">
        <ChatContainer sessionId={"ses_0cd21a9baffeQE7mN8zAJZ436L"} />
      </div>
    </div>
  );
}
