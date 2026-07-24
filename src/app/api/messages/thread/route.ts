import { appOk } from "@/lib/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId") ?? "default-thread";

  return appOk({
    conversationId,
    messages: [
      { id: "msg-1", content: "Hello" },
      { id: "msg-2", content: "How can I help?" },
    ],
  });
}
