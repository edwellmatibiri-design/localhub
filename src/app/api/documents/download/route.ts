import { NextResponse } from "next/server";
import { getDocumentDownloadUrl } from "@/lib/business/documents";

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
    const url = await getDocumentDownloadUrl(documentId);
    if (!url) {
      return NextResponse.json(
        { ok: false, error: "Document not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true, url });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to resolve download URL",
      },
      { status: 500 },
    );
  }
}
