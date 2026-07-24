export default function MessageBubble({
  mine,
  content,
}: {
  mine?: boolean;
  content: string;
}) {
  return (
    <div
      className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-lh-accent text-lh-on-accent ml-auto" : "text-lh-on-accent text-lh-text-primary"}`}
    >
      {content}
    </div>
  );
}
