import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { upsertCrmPipeline } from "@/lib/crm/pipeline";
import { logBehaviourEvent } from "@/lib/behaviour/service";

type SendMessageBody = {
  conversationId?: number | string;
  senderType?: "user" | "vendor";
  senderId?: string;
  message?: string;
};

export async function POST(request: Request) {
  let body: SendMessageBody;
  try {
    body = (await request.json()) as SendMessageBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const conversationId = Number(body.conversationId);
  const senderType = String(body.senderType ?? "").trim();
  const senderId = String(body.senderId ?? "").trim();
  const message = String(body.message ?? "").trim();

  if (
    !Number.isFinite(conversationId) ||
    conversationId <= 0 ||
    !senderType ||
    !senderId ||
    !message
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: "conversationId, senderType, senderId, message are required",
      },
      { status: 400 },
    );
  }

  if (senderType !== "user" && senderType !== "vendor") {
    return NextResponse.json(
      { ok: false, error: "senderType must be user or vendor" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();
    const { data: created, error: createError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_type: senderType,
        sender_id: senderId,
        message,
      })
      .select("id")
      .single();

    if (createError) {
      return NextResponse.json(
        { ok: false, error: createError.message },
        { status: 500 },
      );
    }

    const { data: conversation } = await supabase
      .from("conversations")
      .select("id, user_id, vendor_id")
      .eq("id", conversationId)
      .maybeSingle();

    if (conversation?.id) {
      const base = {
        type: "message_received",
        message: `New message in conversation ${conversationId}: ${message.slice(0, 80)}`,
      };

      const senderUserId =
        senderType === "user"
          ? String(senderId)
          : String(conversation.user_id ?? "");
      const receiverUserId =
        senderType === "user" ? String(conversation.user_id ?? "") : "";

      if (senderUserId) {
        await logBehaviourEvent({
          userId: senderUserId,
          type: "message_sent",
          metadata: { conversationId, messageId: Number(created.id) },
        });
      }

      if (receiverUserId) {
        await logBehaviourEvent({
          userId: receiverUserId,
          type: "message_received",
          metadata: { conversationId, messageId: Number(created.id) },
        });
      }

      if (senderType === "user") {
        await supabase.from("notifications").insert({
          ...base,
          vendor_id: conversation.vendor_id,
          user_id: null,
        });
      } else {
        await supabase
          .from("notifications")
          .insert({ ...base, user_id: conversation.user_id, vendor_id: null });

        const { data: latestQuote } = await supabase
          .from("quotes")
          .select("id")
          .eq("vendor_id", String(conversation.vendor_id))
          .eq("user_id", String(conversation.user_id))
          .order("id", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestQuote?.id) {
          await upsertCrmPipeline({
            vendorId: String(conversation.vendor_id),
            quoteId: Number(latestQuote.id),
            stage: "negotiation",
            probability: 65,
            metadata: { source: "api:messages:send", conversationId },
          });
        }
      }
    }

    return NextResponse.json({ ok: true, messageId: created.id });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to send message",
      },
      { status: 500 },
    );
  }
}
