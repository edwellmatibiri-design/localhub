import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

type ConversationBody = {
  conversationId?: number | string;
};

export async function POST(request: Request) {
  let body: ConversationBody;
  try {
    body = (await request.json()) as ConversationBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const conversationId = Number(body.conversationId);
  if (!Number.isFinite(conversationId) || conversationId <= 0) {
    return NextResponse.json(
      { error: "conversationId is required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();

    const [
      { data: conversation, error: conversationError },
      { data: messages, error: messagesError },
    ] = await Promise.all([
      supabase
        .from("conversations")
        .select("id, user_id, vendor_id, created_at")
        .eq("id", conversationId)
        .maybeSingle(),
      supabase
        .from("messages")
        .select(
          "id, conversation_id, sender_type, sender_id, message, created_at",
        )
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true }),
    ]);

    if (conversationError) {
      return NextResponse.json(
        { error: conversationError.message },
        { status: 500 },
      );
    }

    if (messagesError) {
      return NextResponse.json(
        { error: messagesError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      conversation,
      messages: messages ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch conversation",
      },
      { status: 500 },
    );
  }
}
