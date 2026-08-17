"""Pydantic schemas for the OptiLLM API."""

from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str = Field(..., description="Role: system, user, or assistant")
    content: str = Field(..., description="Message content")


class ChatRequest(BaseModel):
    messages: List[ChatMessage] = Field(..., min_length=1)
    model: Optional[str] = Field(None, description="Override model (or leave for auto-route)")
    temperature: Optional[float] = Field(None, ge=0, le=2)
    max_tokens: Optional[int] = Field(None, ge=1)
    use_cache: bool = True
    optimize: bool = True
    use_rag: bool = True


class ChatResponseChoice(BaseModel):
    index: int
    message: ChatMessage
    finish_reason: Optional[str] = None


class ChatResponseUsage(BaseModel):
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


class ChatResponse(BaseModel):
    id: str
    model: str
    provider: str
    choices: List[ChatResponseChoice]
    usage: ChatResponseUsage
    cost_usd: float
    baseline_cost_usd: float
    latency_ms: int
    cache_hit: bool
    cache_similarity: Optional[float] = None
    route_reason: Optional[str] = None
    intent: Optional[str] = None
    complexity_score: Optional[float] = None
    original_prompt: Optional[str] = None
    optimized_prompt: Optional[str] = None
    fallback_used: bool = False


class RequestOut(BaseModel):
    id: int
    prompt: str
    response: str
    model: str
    provider: str
    input_tokens: int
    output_tokens: int
    cost_usd: float
    baseline_cost_usd: float
    latency_ms: int
    cache_hit: bool
    cache_similarity: Optional[float] = None
    route_reason: Optional[str] = None
    intent: Optional[str] = None
    complexity_score: Optional[float] = None
    original_prompt: Optional[str] = None
    optimized_prompt: Optional[str] = None
    fallback_used: bool
    status: str
    error_message: Optional[str] = None
    api_key_id: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class RequestList(BaseModel):
    items: List[RequestOut]
    total: int


class CacheEntryOut(BaseModel):
    id: int
    prompt: str
    response: str
    model: str
    provider: str
    input_tokens: int
    output_tokens: int
    cost_usd: float
    hit_count: int
    last_similarity: Optional[float] = None
    created_at: datetime
    last_hit_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class CacheList(BaseModel):
    items: List[CacheEntryOut]
    total: int
    hit_rate_7d: float
    entry_count: int
    threshold: float


class ApiKeyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=128)


class ApiKeyOut(BaseModel):
    id: int
    name: str
    key_prefix: str
    created_at: datetime
    last_used_at: Optional[datetime] = None
    revoked: bool

    model_config = {"from_attributes": True}


class ApiKeyCreated(ApiKeyOut):
    secret: str


class TimeseriesPoint(BaseModel):
    date: str
    requests: int
    cost: float
    saved: float
    cache_hits: int


class NamedCount(BaseModel):
    name: str
    count: int
    cost: float = 0.0


class AnalyticsOverview(BaseModel):
    total_requests: int
    total_cost_usd: float
    baseline_cost_usd: float
    cost_saved_usd: float
    cache_hit_rate: float
    avg_latency_ms: float
    timeseries: List[TimeseriesPoint]
    models: List[NamedCount]
    intents: List[NamedCount]
    providers: List[NamedCount]


class DocumentOut(BaseModel):
    id: int
    filename: str
    content_type: str
    size_bytes: int
    chunk_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class RouterInfo(BaseModel):
    simple_model: str
    complex_model: str
    complexity_threshold: float
    rules: List[str]


class SettingsOut(BaseModel):
    cache_similarity_threshold: float
    default_simple_model: str
    default_complex_model: str
    complexity_threshold: float
    embedding_model: str
