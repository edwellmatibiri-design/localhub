export default function MessageInput() {
  return (
    <form className="mt-3 flex gap-2">
      <input className="w-full rounded-lg border border-lh-border px-3 py-2" placeholder="Type your message" />
      <button className="rounded-lg bg-lh-electric-blue px-4 py-2 text-sm font-medium text-white" type="submit">
        Send
      </button>
    </form>
  );
}
