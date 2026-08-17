"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Send,
  Bot,
  Cpu,
  AlignLeft,
  DollarSign,
  Timer,
  Database,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { sendChat } from "@/lib/api";
import type { ChatMessage, ChatResponse } from "@/lib/types";

interface ChatMsg {
  role: "user" | "ai";
  content: string;
  meta?: {
    model: string;
    tokens: number;
    cost: string;
    latency: string;
    cache: "Hit" | "Miss";
  };
}

function ToggleSwitch({
  label,
  enabled,
  onChange,
}: {
  label: string;
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={cn(
          "relative w-8 h-4 rounded-full transition-colors",
          enabled ? "bg-primary-container" : "bg-surface-container-highest"
        )}
      >
        <div
          className={cn(
            "absolute top-[2px] w-3 h-3 rounded-full transition-transform",
            enabled ? "translate-x-[18px] bg-primary" : "translate-x-[2px] bg-outline"
          )}
        />
      </button>
      <span className="text-[13px] text-on-surface-variant group-hover:text-on-surface transition-colors">
        {label}
      </span>
    </label>
  );
}

export function ChatPanel({
  onResponse,
}: {
  onResponse: (res: ChatResponse | null) => void;
}) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("Auto-Route");
  const [semanticCache, setSemanticCache] = useState(true);
  const [optimize, setOptimize] = useState(true);
  const [useRag, setUseRag] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    const prompt = input.trim();
    if (!prompt || loading) return;

    const userMsg: ChatMsg = { role: "user", content: prompt };
    const nextHistory: ChatMessage[] = [...history, { role: "user", content: prompt }];
    setMessages((prev) => [...prev, userMsg]);
    setHistory(nextHistory);
    setInput("");
    setLoading(true);

    try {
      const modelOverride =
        selectedModel === "Auto-Route"
          ? undefined
          : selectedModel.toLowerCase().replace(/\s+/g, "-");
      const data = await sendChat(nextHistory, {
        model: modelOverride,
        use_cache: semanticCache,
        optimize,
        use_rag: useRag,
      });
      onResponse(data);
      const assistantContent = data.choices?.[0]?.message?.content || "No response";
      setHistory((prev) => [...prev, { role: "assistant", content: assistantContent }]);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: assistantContent,
          meta: {
            model: data.model || "unknown",
            tokens: data.usage?.total_tokens || 0,
            cost: `$${data.cost_usd?.toFixed(6) || "0.000000"}`,
            latency: `${data.latency_ms || 0}ms`,
            cache: data.cache_hit ? "Hit" : "Miss",
          },
        },
      ]);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: `Error: ${errorMessage}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex-1 flex flex-col h-full border-r border-outline-variant relative z-10 bg-surface-container-lowest">
      <div className="h-14 border-b border-outline-variant bg-surface-container flex items-center justify-between px-4 shrink-0 gap-3">
        <div className="relative">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="appearance-none bg-surface-container-high border border-outline-variant text-on-surface text-[13px] rounded-lg px-3 py-1.5 pr-8 focus:outline-none focus:border-primary cursor-pointer"
          >
            <option>Auto-Route</option>
            <option>gpt-4o</option>
            <option>gpt-4o-mini</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none w-4 h-4" />
        </div>
        <div className="flex items-center gap-4 overflow-x-auto">
          <ToggleSwitch label="Cache" enabled={semanticCache} onChange={setSemanticCache} />
          <ToggleSwitch label="Optimize" enabled={optimize} onChange={setOptimize} />
          <ToggleSwitch label="RAG" enabled={useRag} onChange={setUseRag} />
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
                <Bot className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-on-surface mb-1">
                OptiLLM Playground
              </h3>
              <p className="text-sm text-on-surface-variant max-w-md">
                Prompts are optimized, routed, cached, and logged. Repeat a similar
                question to see a cache hit.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, i) =>
          msg.role === "user" ? (
            <div key={i} className="flex justify-end w-full">
              <div className="max-w-[80%] bg-surface-container-highest border border-outline-variant rounded-xl rounded-tr-sm p-4 text-on-surface text-sm">
                {msg.content}
              </div>
            </div>
          ) : (
            <div key={i} className="flex justify-start w-full">
              <div className="max-w-[90%] flex flex-col gap-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center text-primary">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
                    OptiLLM Router
                  </span>
                </div>
                <div className="bg-surface-container border border-outline-variant rounded-xl rounded-tl-sm p-4 text-on-surface text-sm whitespace-pre-wrap">
                  {msg.content}
                </div>
                {msg.meta && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <MetaPill icon={Cpu} label={`Model: ${msg.meta.model}`} />
                    <MetaPill icon={AlignLeft} label={`Tokens: ${msg.meta.tokens}`} />
                    <MetaPill icon={DollarSign} label={`Cost: ${msg.meta.cost}`} />
                    <MetaPill icon={Timer} label={`Latency: ${msg.meta.latency}`} />
                    <MetaPill
                      icon={Database}
                      label={`Cache: ${msg.meta.cache}`}
                      variant={msg.meta.cache === "Hit" ? "success" : "default"}
                    />
                  </div>
                )}
              </div>
            </div>
          )
        )}

        {loading && (
          <div className="flex justify-start w-full">
            <div className="flex items-center gap-2 text-on-surface-variant text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Thinking...
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-surface-container border-t border-outline-variant shrink-0">
        <div className="glass-panel rounded-xl flex flex-col focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/50">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="w-full bg-transparent border-none resize-none text-on-surface text-sm p-4 min-h-[100px] focus:outline-none placeholder:text-outline"
            placeholder="Enter your prompt here..."
            disabled={loading}
          />
          <div className="flex justify-end items-center p-3 pt-0">
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className={cn(
                "bg-gradient-to-b from-primary to-primary-container text-on-primary-container px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:opacity-90 electric-glow border-t border-white/20",
                (loading || !input.trim()) && "opacity-50 cursor-not-allowed"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  Send
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function MetaPill({
  icon: Icon,
  label,
  variant = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  variant?: "default" | "success";
}) {
  return (
    <div
      className={cn(
        "px-2 py-1 bg-surface border border-outline-variant rounded flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.05em]",
        variant === "success" ? "text-secondary" : "text-on-surface-variant"
      )}
    >
      <Icon className="w-3 h-3" />
      {label}
    </div>
  );
}
