import { NextResponse } from "next/server";
import { classifyIntent } from "@/lib/support/agents/intentClassifier";
import { retrieveKnowledge } from "@/lib/support/agents/knowledgeRetriever";
import { generateSupportResponse } from "@/lib/support/agents/supportResponder";
import { generateTutorial } from "@/lib/support/agents/tutorialAgent";
import { troubleshoot } from "@/lib/support/agents/troubleshooterAgent";
import { escalateIssue } from "@/lib/support/agents/escalationAgent";
import { logAnalytics } from "@/lib/support/agents/analyticsAgent";
import { rateLimit } from "@/lib/rateLimit";

type SupportChatBody = {
  message?: string;
  userId?: string;
};

export async function POST(req: Request) {
  const limited = await rateLimit(req);
  if (!limited.ok) {
    return new Response("Too Many Requests", { status: 429 });
  }

  const body = (await req.json()) as SupportChatBody;
  const message = String(body.message ?? "").trim();
  const userId = String(body.userId ?? "anonymous");

  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const intent = classifyIntent(message);
  logAnalytics(intent);

  const kb = retrieveKnowledge(intent.category, intent.userType);
  const response = generateSupportResponse(intent, kb);

  let tutorial: string[] | null = null;
  let troubleshooting: string[] | null = null;
  let escalation = null;

  if (intent.category === "tutorial") {
    tutorial = generateTutorial(message.replace("tutorial", "").trim());
  }

  if (intent.category !== "tutorial") {
    troubleshooting = troubleshoot(intent.category);
  }

  if (intent.escalate) {
    escalation = escalateIssue(
      userId,
      intent.category,
      message,
      intent.severity,
    );
  }

  return NextResponse.json({
    intent,
    response,
    tutorial,
    troubleshooting,
    escalation,
  });
}
