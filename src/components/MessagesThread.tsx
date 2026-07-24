import MessageBubble from "@/components/MessageBubble";
import MessageInput from "@/components/MessageInput";

export default function MessagesThread() {
  return (
    <div className="card">
      <h3 className="text-base font-semibold">Conversation</h3>
      <div className="mt-3 space-y-2">
        <MessageBubble content="Hi, can you do same-day service?" />
        <MessageBubble mine content="Yes, available from 3pm in your suburb." />
      </div>
      <MessageInput />
    </div>
  );
}
