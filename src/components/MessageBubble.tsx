export default function MessageBubble({ mine, content }: { mine?: boolean; content: string }) {
  return (
    <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${mine ? "ml-auto bg-lh-electric-blue text-white" : "bg-slate-100 text-lh-charcoal"}`}>
      {content}
    </div>
  );
}
