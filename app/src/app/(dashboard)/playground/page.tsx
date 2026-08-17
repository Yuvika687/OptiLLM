"use client";

import { useEffect, useState } from "react";
import { ChatPanel } from "@/components/playground/chat-panel";
import { RequestInspector } from "@/components/playground/request-inspector";
import { API_BASE } from "@/lib/api";
import type { ChatResponse } from "@/lib/types";

export default function PlaygroundPage() {
  const [last, setLast] = useState<ChatResponse | null>(null);
  const [openaiOk, setOpenaiOk] = useState<boolean | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then((r) => r.json())
      .then((h) => setOpenaiOk(Boolean(h.openai_configured)))
      .catch(() => setOpenaiOk(false));
  }, []);

  return (
    <div className="flex flex-col lg:flex-row -m-4 lg:-m-8 h-[calc(100vh-4rem)] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0" />
      {openaiOk === false && (
        <div className="absolute top-16 left-4 right-4 lg:right-[520px] z-20 glass-panel px-4 py-2 text-[13px] text-tertiary">
          OPENAI_API_KEY is not configured on the API. Cache hits still work;
          new completions will return 503 until you set a real key.
        </div>
      )}
      <ChatPanel onResponse={setLast} />
      <div className="hidden lg:flex">
        <RequestInspector last={last} />
      </div>
    </div>
  );
}
