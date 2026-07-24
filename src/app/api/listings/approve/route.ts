import { appFail, appOk, parseBody } from "@/lib/api";
import { approveListing } from "@/lib/listings/moderation";
import { NextResponse } from "next/server";

type Body = {
  listingId?: string;
  id?: string;
};

export async function POST(request: Request) {
  const body = await parseBody<Body>(request);
  const listingId = String(body?.listingId ?? body?.id ?? "").trim();

  if (!listingId) {
    return appFail(400, "listingId is required");
  }

  try {
    await approveListing(listingId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to approve listing";
    const status = message === "Not authorized" ? 403 : 500;
    return appFail(status, message);
  }
}
