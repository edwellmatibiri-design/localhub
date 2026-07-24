type SupportMessage = {
  from: "user" | "bot";
  text: string;
  steps?: string[];
  tutorial?: string[] | null;
  troubleshooting?: string[] | null;
  escalation?: {
    ticketId: string;
  } | null;
};

export function SupportBubble({ msg }: { msg: SupportMessage }) {
  const isUser = msg.from === "user";

  return (
    <div className={`flex text-sm ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-lh-accent text-lh-on-accent"
            : "border-lh-border bg-lh-surface-soft text-lh-text-primary border"
        }`}
      >
        <p>{msg.text}</p>

        {msg.steps && msg.steps.length > 0 && (
          <div className="mt-2">
            <p className="mb-1 text-xs font-medium">Steps:</p>
            <ul className="text-lh-text-secondary text-xs">
              {msg.steps.map((s, i) => (
                <li key={i}>- {s}</li>
              ))}
            </ul>
          </div>
        )}

        {msg.tutorial && msg.tutorial.length > 0 && (
          <div className="mt-2">
            <p className="mb-1 text-xs font-medium">Tutorial:</p>
            <ul className="text-lh-text-secondary text-xs">
              {msg.tutorial.map((t, i) => (
                <li key={i}>- {t}</li>
              ))}
            </ul>
          </div>
        )}

        {msg.troubleshooting && msg.troubleshooting.length > 0 && (
          <div className="mt-2">
            <p className="mb-1 text-xs font-medium">Troubleshooting:</p>
            <ul className="text-lh-text-secondary text-xs">
              {msg.troubleshooting.map((t, i) => (
                <li key={i}>- {t}</li>
              ))}
            </ul>
          </div>
        )}

        {msg.escalation?.ticketId && (
          <div className="text-lh-warning mt-2 text-xs">
            Ticket created: {msg.escalation.ticketId}
          </div>
        )}
      </div>
    </div>
  );
}
