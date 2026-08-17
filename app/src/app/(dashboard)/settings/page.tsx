"use client";

import { useEffect, useState } from "react";
import {
  createKey,
  fetchKeys,
  getStoredApiKey,
  revokeKey,
  setStoredApiKey,
} from "@/lib/api";
import type { ApiKeyRow } from "@/lib/types";

export default function SettingsPage() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [name, setName] = useState("");
  const [revealed, setRevealed] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activePrefix, setActivePrefix] = useState<string>("");

  const reload = () =>
    fetchKeys()
      .then(setKeys)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load")
      );

  useEffect(() => {
    reload();
    const stored = getStoredApiKey();
    if (stored) setActivePrefix(stored.slice(0, 12));
  }, []);

  const onCreate = async () => {
    setError(null);
    try {
      const created = await createKey(name.trim() || "Untitled key");
      if (created.secret) {
        setRevealed(created.secret);
        setStoredApiKey(created.secret);
        setActivePrefix(created.secret.slice(0, 12));
      }
      setName("");
      await reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Create failed");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-[32px] font-semibold tracking-tight text-on-surface leading-10">
          Settings
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Gateway API keys. Playground and any external client must send{" "}
          <code className="font-mono text-xs">X-API-Key</code>.
        </p>
      </div>

      {error && (
        <div className="glass-panel rounded-xl p-4 text-sm text-error">{error}</div>
      )}

      {revealed && (
        <div className="glass-panel rounded-xl p-4 border border-secondary/30">
          <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-secondary mb-2">
            Copy this secret now — it is not shown again
          </div>
          <code className="font-mono text-sm text-on-surface break-all">{revealed}</code>
        </div>
      )}

      <div className="glass-panel rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Key name (e.g. production-app)"
          className="flex-1 bg-[#0B0F19] border border-[#1F2937] rounded-lg px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
        />
        <button
          onClick={onCreate}
          className="px-4 py-2 rounded-lg text-sm font-bold bg-primary-container text-on-primary-container"
        >
          Generate key
        </button>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#1F2937] bg-[#0B0F19]/50">
              {["Name", "Prefix", "Created", "Last used", "Status", ""].map((h) => (
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
            {keys.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-on-surface-variant">
                  No keys yet. Generate one to call /v1/chat.
                </td>
              </tr>
            ) : (
              keys.map((key) => (
                <tr key={key.id} className="border-b border-[#1F2937]/50">
                  <td className="px-4 py-3 text-on-surface">
                    {key.name}
                    {activePrefix === key.key_prefix && (
                      <span className="ml-2 text-[11px] text-secondary">active</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-[13px]">{key.key_prefix}…</td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {new Date(key.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {key.last_used_at
                      ? new Date(key.last_used_at).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {key.revoked ? (
                      <span className="text-error">Revoked</span>
                    ) : (
                      <span className="text-secondary">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!key.revoked && (
                      <button
                        onClick={async () => {
                          await revokeKey(key.id);
                          await reload();
                        }}
                        className="text-[12px] text-error hover:underline"
                      >
                        Revoke
                      </button>
                    )}
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
