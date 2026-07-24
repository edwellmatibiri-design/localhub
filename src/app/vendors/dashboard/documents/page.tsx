"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/db";
import {
  DocumentDeleteButton,
  DocumentDownloadButton,
} from "@/components/business/DocumentActions";

type DocumentRow = {
  id: number;
  vendor_id: string;
  name: string;
  file_url: string;
  type: "contract" | "job_sheet" | "other";
  created_at: string;
};

export default function VendorDocumentsPage() {
  const [vendorId, setVendorId] = useState("");
  const [rows, setRows] = useState<DocumentRow[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("Untitled document");
  const [type, setType] = useState<"contract" | "job_sheet" | "other">("other");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const queryVendorId =
        new URLSearchParams(window.location.search).get("vendorId") ?? "";
      let activeVendorId = queryVendorId;
      if (!activeVendorId) {
        const { data: profile } = await supabase
          .from("seller_profiles")
          .select("id")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        activeVendorId = String(profile?.id ?? "");
      }

      setVendorId(activeVendorId);
      if (!activeVendorId) {
        setRows([]);
        return;
      }

      const { data, error: readError } = await supabase
        .from("documents")
        .select("id, vendor_id, name, file_url, type, created_at")
        .eq("vendor_id", activeVendorId)
        .order("created_at", { ascending: false });

      if (readError) throw readError;
      setRows((data ?? []) as DocumentRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const grouped = useMemo(
    () => ({
      contracts: rows.filter((row) => row.type === "contract"),
      jobSheets: rows.filter((row) => row.type === "job_sheet"),
      other: rows.filter((row) => row.type === "other"),
    }),
    [rows],
  );

  async function upload() {
    if (!vendorId || !file) return;
    setUploading(true);
    setError(null);

    try {
      const form = new FormData();
      form.set("vendorId", vendorId);
      form.set("name", name || file.name);
      form.set("type", type);
      form.set("file", file);

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: form,
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok)
        throw new Error(String(payload?.error ?? "Failed to upload document"));

      setFile(null);
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to upload document",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="shell space-y-4 p-6">
      <div className="card space-y-2">
        <h1 className="text-2xl font-semibold">Vendor Documents</h1>
        <p className="text-lh-muted text-sm">
          Vendor: {vendorId || "Not selected"}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="border-lh-border rounded border px-2 py-1 text-sm"
            placeholder="Document name"
          />
          <select
            value={type}
            onChange={(event) =>
              setType(event.target.value as "contract" | "job_sheet" | "other")
            }
            className="border-lh-border rounded border px-2 py-1 text-sm"
          >
            <option value="contract">Contract</option>
            <option value="job_sheet">Job Sheet</option>
            <option value="other">Other</option>
          </select>
          <input
            type="file"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="text-sm"
          />
          <button
            type="button"
            onClick={() => void upload()}
            disabled={!file || uploading || !vendorId}
            className="bg-lh-accent text-lh-on-accent rounded px-3 py-1 text-sm disabled:opacity-60"
          >
            {uploading ? "Uploading..." : "Upload document"}
          </button>
        </div>
      </div>

      {loading && (
        <p className="card text-lh-muted text-sm">Loading documents...</p>
      )}
      {error && <p className="card text-lh-danger text-sm">{error}</p>}

      {!loading && (
        <div className="space-y-3">
          {[
            { label: "Contracts", rows: grouped.contracts },
            { label: "Job Sheets", rows: grouped.jobSheets },
            { label: "Other Documents", rows: grouped.other },
          ].map((section) => (
            <section key={section.label} className="space-y-2">
              <h2 className="text-lg font-semibold">{section.label}</h2>
              {section.rows.length === 0 ? (
                <div className="card">
                  <p className="text-lh-muted text-sm">No documents.</p>
                </div>
              ) : (
                section.rows.map((row) => (
                  <article
                    key={row.id}
                    className="card flex flex-wrap items-center justify-between gap-2"
                  >
                    <div>
                      <p className="font-medium">{row.name}</p>
                      <p className="text-lh-muted text-xs">
                        Uploaded: {new Date(row.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <DocumentDownloadButton documentId={row.id} />
                      <DocumentDeleteButton
                        documentId={row.id}
                        onDone={() => window.location.reload()}
                      />
                    </div>
                  </article>
                ))
              )}
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
