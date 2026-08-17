export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  id: string;
  model: string;
  provider: string;
  choices: {
    index: number;
    message: ChatMessage;
    finish_reason: string | null;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  cost_usd: number;
  baseline_cost_usd: number;
  latency_ms: number;
  cache_hit: boolean;
  cache_similarity: number | null;
  route_reason: string | null;
  intent: string | null;
  complexity_score: number | null;
  original_prompt: string | null;
  optimized_prompt: string | null;
  fallback_used: boolean;
}

export interface RequestRow {
  id: number;
  prompt: string;
  response: string;
  model: string;
  provider: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  baseline_cost_usd: number;
  latency_ms: number;
  cache_hit: boolean;
  cache_similarity: number | null;
  route_reason: string | null;
  intent: string | null;
  complexity_score: number | null;
  original_prompt: string | null;
  optimized_prompt: string | null;
  fallback_used: boolean;
  status: string;
  error_message: string | null;
  api_key_id: number | null;
  created_at: string;
}

export interface CacheEntry {
  id: number;
  prompt: string;
  response: string;
  model: string;
  provider: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  hit_count: number;
  last_similarity: number | null;
  created_at: string;
  last_hit_at: string | null;
}

export interface CacheList {
  items: CacheEntry[];
  total: number;
  hit_rate_7d: number;
  entry_count: number;
  threshold: number;
}

export interface ApiKeyRow {
  id: number;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked: boolean;
  secret?: string;
}

export interface TimeseriesPoint {
  date: string;
  requests: number;
  cost: number;
  saved: number;
  cache_hits: number;
}

export interface NamedCount {
  name: string;
  count: number;
  cost: number;
}

export interface AnalyticsOverview {
  total_requests: number;
  total_cost_usd: number;
  baseline_cost_usd: number;
  cost_saved_usd: number;
  cache_hit_rate: number;
  avg_latency_ms: number;
  timeseries: TimeseriesPoint[];
  models: NamedCount[];
  intents: NamedCount[];
  providers: NamedCount[];
}

export interface DocumentRow {
  id: number;
  filename: string;
  content_type: string;
  size_bytes: number;
  chunk_count: number;
  created_at: string;
}

export interface RouterInfo {
  simple_model: string;
  complex_model: string;
  complexity_threshold: number;
  rules: string[];
}
