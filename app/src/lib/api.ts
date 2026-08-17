import type {
  AnalyticsOverview,
  ApiKeyRow,
  CacheList,
  ChatMessage,
  ChatResponse,
  DocumentRow,
  RequestRow,
  RouterInfo,
} from "./types";

export const API_BASE =
  typeof window === "undefined"
    ? process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    : "/gateway";

const KEY_STORAGE = "optillm_api_key";

export function getStoredApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEY_STORAGE);
}

export function setStoredApiKey(secret: string) {
  localStorage.setItem(KEY_STORAGE, secret);
}

export function clearStoredApiKey() {
  localStorage.removeItem(KEY_STORAGE);
}

async function parseError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body.detail === "string") return body.detail;
    return JSON.stringify(body.detail ?? body);
  } catch {
    return `HTTP ${res.status}`;
  }
}

export async function api<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (init.auth !== false) {
    const key = getStoredApiKey();
    if (key) headers.set("X-API-Key", key);
  }
  let res: Response | null = null;
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      res = await fetch(`${API_BASE}${path}`, { ...init, headers });
      lastErr = null;
      break;
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
  if (!res) {
    throw new Error(
      lastErr instanceof Error
        ? lastErr.message
        : "Could not reach the OptiLLM API (Render may be waking up). Retry in 30s."
    );
  }
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function ensureApiKey(): Promise<string> {
  const existing = getStoredApiKey();
  if (existing) return existing;
  const created = await api<ApiKeyRow>("/v1/keys", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ name: "Playground" }),
  });
  if (!created.secret) {
    throw new Error("Key created but secret was not returned");
  }
  setStoredApiKey(created.secret);
  return created.secret;
}

export async function sendChat(
  messages: ChatMessage[],
  opts: {
    model?: string;
    use_cache?: boolean;
    optimize?: boolean;
    use_rag?: boolean;
  } = {}
): Promise<ChatResponse> {
  await ensureApiKey();
  const body: Record<string, unknown> = { messages };
  if (opts.model) body.model = opts.model;
  if (opts.use_cache !== undefined) body.use_cache = opts.use_cache;
  if (opts.optimize !== undefined) body.optimize = opts.optimize;
  if (opts.use_rag !== undefined) body.use_rag = opts.use_rag;
  return api<ChatResponse>("/v1/chat", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function fetchAnalytics(days = 14) {
  return api<AnalyticsOverview>(`/v1/analytics/overview?days=${days}`, {
    auth: false,
  });
}

export function fetchRequests(params: {
  limit?: number;
  offset?: number;
  cache_hit?: boolean;
  model?: string;
} = {}) {
  const q = new URLSearchParams();
  q.set("limit", String(params.limit ?? 50));
  q.set("offset", String(params.offset ?? 0));
  if (params.cache_hit !== undefined) q.set("cache_hit", String(params.cache_hit));
  if (params.model) q.set("model", params.model);
  return api<{ items: RequestRow[]; total: number }>(`/v1/requests?${q}`, {
    auth: false,
  });
}

export function fetchCache() {
  return api<CacheList>("/v1/cache", { auth: false });
}

export function fetchKeys() {
  return api<ApiKeyRow[]>("/v1/keys", { auth: false });
}

export function createKey(name: string) {
  return api<ApiKeyRow>("/v1/keys", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ name }),
  });
}

export function revokeKey(id: number) {
  return api<ApiKeyRow>(`/v1/keys/${id}`, { method: "DELETE", auth: false });
}

export function fetchRouter() {
  return api<RouterInfo>("/v1/router", { auth: false });
}

export function fetchDocuments() {
  return api<DocumentRow[]>("/v1/documents", { auth: false });
}

export async function uploadDocument(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/v1/documents`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return (await res.json()) as DocumentRow;
}

export function deleteDocument(id: number) {
  return api<{ deleted: number }>(`/v1/documents/${id}`, {
    method: "DELETE",
    auth: false,
  });
}

export function deleteCacheEntry(id: number) {
  return api<{ deleted: number }>(`/v1/cache/${id}`, {
    method: "DELETE",
    auth: false,
  });
}

export function clearCache() {
  return api<{ deleted: number }>("/v1/cache", {
    method: "DELETE",
    auth: false,
  });
}
