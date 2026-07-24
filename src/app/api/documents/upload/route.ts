import { NextResponse } from "next/server";
import { uploadDocument } from "@/lib/business/documents";

type SupportedType = "contract" | "job_sheet" | "other";

function normalizeType(value: string): SupportedType {
  if (value === "contract" || value === "job_sheet") return value;
  return "other";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const vendorId = String(formData.get("vendorId") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();
    const type = normalizeType(String(formData.get("type") ?? "other").trim());
    const file = formData.get("file");

    if (!vendorId || !name || !(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "vendorId, name and file are required" },
        { status: 400 },
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const documentId = await uploadDocument({
      vendorId,
      name,
      type,
      fileData: bytes,
      contentType: file.type || "application/octet-stream",
    });

    return NextResponse.json({ ok: true, documentId });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to upload document",
      },
      { status: 500 },
    );
  }
}
