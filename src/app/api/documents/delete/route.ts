import { NextResponse } from "next/server";
import { deleteDocument } from "@/lib/business/documents";

type Body = { documentId?: number | string };

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const documentId = Number(body.documentId);
  if (!Number.isFinite(documentId) || documentId <= 0) {
    return NextResponse.json(
      { ok: false, error: "documentId is required" },
      { status: 400 },
    );
  }

  try {
    await deleteDocument(documentId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to delete document",
      },
      { status: 500 },
    );
  }
}
