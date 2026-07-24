import { createServiceClient } from "@/lib/db";
import { renderSimplePdf } from "@/lib/business/pdf";

const BUCKET = "business-documents";

type DocumentType = "contract" | "job_sheet" | "other";

async function ensureBucket() {
  const supabase = createServiceClient();
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = (buckets ?? []).some((bucket) => bucket.name === BUCKET);
  if (exists) return;

  await supabase.storage.createBucket(BUCKET, {
    public: false,
    fileSizeLimit: 5 * 1024 * 1024,
  });
}

function extFromName(name: string) {
  const trimmed = String(name ?? "").trim();
  const index = trimmed.lastIndexOf(".");
  return index > -1 ? trimmed.slice(index + 1).toLowerCase() : "bin";
}

export async function uploadDocument(input: {
  vendorId: string;
  name: string;
  type: DocumentType;
  fileData: Buffer;
  contentType?: string;
}) {
  const vendorId = String(input.vendorId ?? "").trim();
  const name = String(input.name ?? "").trim();
  if (!vendorId || !name) {
    throw new Error("vendorId and name are required");
  }

  await ensureBucket();

  const supabase = createServiceClient();
  const ext = extFromName(name);
  const path = `${vendorId}/${Date.now()}-${Math.round(Math.random() * 1e8)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, input.fileData, {
      contentType: input.contentType ?? "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: signed, error: signedError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 7);
  if (signedError) {
    throw new Error(signedError.message);
  }

  const { data, error } = await supabase
    .from("documents")
    .insert({
      vendor_id: vendorId,
      name,
      file_url: signed.signedUrl,
      type: input.type,
      storage_path: path,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return Number(data.id);
}

export async function deleteDocument(documentId: number) {
  const supabase = createServiceClient();
  const { data: doc, error: readError } = await supabase
    .from("documents")
    .select("id, storage_path")
    .eq("id", documentId)
    .maybeSingle();

  if (readError) {
    throw new Error(readError.message);
  }

  if (!doc) return;

  if (doc.storage_path) {
    await supabase.storage.from(BUCKET).remove([String(doc.storage_path)]);
  }

  const { error: deleteError } = await supabase
    .from("documents")
    .delete()
    .eq("id", documentId);
  if (deleteError) {
    throw new Error(deleteError.message);
  }
}

export async function createJobSheetDocument(input: {
  bookingId: number;
  vendorId: string;
  userId: string;
  serviceDescription: string;
  dateTime: string;
  location: string;
  notes: string;
}) {
  const lines = [
    "LocalHub Job Sheet",
    `Booking ID: ${input.bookingId}`,
    `Vendor ID: ${input.vendorId}`,
    `User ID: ${input.userId}`,
    `Service: ${input.serviceDescription}`,
    `Date/Time: ${input.dateTime}`,
    `Location: ${input.location}`,
    `Notes: ${input.notes || "-"}`,
  ];

  const pdf = renderSimplePdf(lines);
  const id = await uploadDocument({
    vendorId: input.vendorId,
    name: `job-sheet-${input.bookingId}.pdf`,
    type: "job_sheet",
    fileData: pdf,
    contentType: "application/pdf",
  });

  return id;
}

export async function createContractDocument(input: {
  vendorId: string;
  userId: string;
  bookingId: number;
  terms: string;
}) {
  const lines = [
    "LocalHub Contract",
    `Vendor ID: ${input.vendorId}`,
    `User ID: ${input.userId}`,
    `Booking ID: ${input.bookingId}`,
    "Terms:",
    ...String(input.terms ?? "")
      .split("\n")
      .slice(0, 120),
  ];

  const pdf = renderSimplePdf(lines);
  const id = await uploadDocument({
    vendorId: input.vendorId,
    name: `contract-${input.bookingId}.pdf`,
    type: "contract",
    fileData: pdf,
    contentType: "application/pdf",
  });

  return id;
}

export async function getDocumentDownloadUrl(documentId: number) {
  const supabase = createServiceClient();
  const { data: doc, error } = await supabase
    .from("documents")
    .select("id, file_url, storage_path")
    .eq("id", documentId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!doc) return null;

  if (doc.storage_path) {
    const { data: signed, error: signedError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(String(doc.storage_path), 60 * 15);
    if (!signedError && signed?.signedUrl) {
      return signed.signedUrl;
    }
  }

  return String(doc.file_url);
}
