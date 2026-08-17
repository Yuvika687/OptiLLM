"use client";

import { useEffect, useState } from "react";
import { deleteDocument, fetchDocuments, uploadDocument } from "@/lib/api";
import type { DocumentRow } from "@/lib/types";

export default function DocumentsPage() {
  const [items, setItems] = useState<DocumentRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = () =>
    fetchDocuments()
      .then(setItems)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load")
      );

  useEffect(() => {
    reload();
  }, []);

  const onUpload = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      await uploadDocument(file);
      await reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-[32px] font-semibold tracking-tight text-on-surface leading-10">
          Document Knowledge Base
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Upload a PDF or text file. OptiLLM chunks it, embeds each chunk, and
          retrieves the top matches into playground prompts when RAG is on.
        </p>
      </div>

      {error && (
        <div className="glass-panel rounded-xl p-4 text-sm text-error">{error}</div>
      )}

      <label className="glass-panel rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/40">
        <input
          type="file"
          accept=".pdf,.txt,.md"
          className="hidden"
          disabled={busy}
          onChange={(e) => onUpload(e.target.files?.[0])}
        />
        <span className="text-sm font-medium text-on-surface">
          {busy ? "Embedding chunks…" : "Click to upload PDF or text (max 8MB)"}
        </span>
      </label>

      <div className="glass-panel rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#1F2937] bg-[#0B0F19]/50">
              {["File", "Chunks", "Size", "Uploaded", ""].map((h) => (
                <th
                  key={h}
                  className="text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant px-4 py-3"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-sm">
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-on-surface-variant">
                  No documents ingested yet.
                </td>
              </tr>
            ) : (
              items.map((doc) => (
                <tr key={doc.id} className="border-b border-[#1F2937]/50">
                  <td className="px-4 py-3 text-on-surface">{doc.filename}</td>
                  <td className="px-4 py-3">{doc.chunk_count}</td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {(doc.size_bytes / 1024).toFixed(1)} KB
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {new Date(doc.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={async () => {
                        await deleteDocument(doc.id);
                        await reload();
                      }}
                      className="text-[12px] text-error hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
