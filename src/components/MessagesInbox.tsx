const conversations = [
  { id: "1", name: "Ayesha Plumbing", snippet: "Can we schedule for Friday?" },
  { id: "2", name: "Khayelitsha Movers", snippet: "Quote shared in the app." },
];

export default function MessagesInbox() {
  return (
    <div className="card">
      <h3 className="text-base font-semibold">Inbox</h3>
      <ul className="mt-3 space-y-2">
        {conversations.map((item) => (
          <li key={item.id} className="rounded-lg border border-lh-border p-3">
            <p className="font-medium">{item.name}</p>
            <p className="text-sm text-lh-muted">{item.snippet}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
