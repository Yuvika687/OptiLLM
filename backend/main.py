"""OptiLLM — FastAPI gateway."""

from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import Depends, FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func
from sqlalchemy.orm import Session

from auth import create_api_key, require_api_key, revoke_api_key
from cache_store import find_best_match, record_hit, store_entry
from config import settings
from database import engine, get_db, ensure_schema
from embeddings import embed_text, openai_configured
from llm import complete_with_fallback
from models import ApiKey, CacheEntry, Document, Request
from optimizer import optimize_prompt
from pricing import estimate_cost
from rag import build_rag_system, ingest_document, retrieve_chunks
from routing import route_model, router_rules
from schemas import (
    AnalyticsOverview,
    ApiKeyCreate,
    ApiKeyCreated,
    ApiKeyOut,
    CacheEntryOut,
    CacheList,
    ChatMessage,
    ChatRequest,
    ChatResponse,
    ChatResponseChoice,
    ChatResponseUsage,
    DocumentOut,
    NamedCount,
    RequestList,
    RequestOut,
    RouterInfo,
    SettingsOut,
    TimeseriesPoint,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_schema()
    print("Database tables created / verified")
    yield


app = FastAPI(
    title="OptiLLM Gateway",
    description="AI gateway with semantic cache, routing, and cost analytics",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _extract_user_prompt(messages: list) -> str:
    for msg in reversed(messages):
        if msg.role == "user":
            return msg.content
    return messages[-1].content


def _key_out(row: ApiKey, secret: Optional[str] = None):
    payload = {
        "id": row.id,
        "name": row.name,
        "key_prefix": row.key_prefix,
        "created_at": row.created_at,
        "last_used_at": row.last_used_at,
        "revoked": row.revoked_at is not None,
    }
    if secret is not None:
        return ApiKeyCreated(**payload, secret=secret)
    return ApiKeyOut(**payload)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "optillm",
        "openai_configured": openai_configured(),
        "embedding_provider": settings.embedding_provider,
    }


@app.get("/v1/settings", response_model=SettingsOut)
def get_settings():
    return SettingsOut(
        cache_similarity_threshold=settings.cache_similarity_threshold,
        default_simple_model=settings.default_simple_model,
        default_complex_model=settings.default_complex_model,
        complexity_threshold=settings.complexity_threshold,
        embedding_model=settings.embedding_model,
    )


@app.get("/v1/router", response_model=RouterInfo)
def get_router():
    return RouterInfo(
        simple_model=settings.default_simple_model,
        complex_model=settings.default_complex_model,
        complexity_threshold=settings.complexity_threshold,
        rules=router_rules(),
    )


@app.post("/v1/keys", response_model=ApiKeyCreated)
def create_key(body: ApiKeyCreate, db: Session = Depends(get_db)):
    row, secret = create_api_key(db, body.name)
    return _key_out(row, secret)


@app.get("/v1/keys", response_model=List[ApiKeyOut])
def list_keys(db: Session = Depends(get_db)):
    rows = db.query(ApiKey).order_by(ApiKey.created_at.desc()).all()
    return [_key_out(row) for row in rows]


@app.delete("/v1/keys/{key_id}", response_model=ApiKeyOut)
def delete_key(key_id: int, db: Session = Depends(get_db)):
    return _key_out(revoke_api_key(db, key_id))


@app.post("/v1/chat", response_model=ChatResponse)
async def chat(
    req: ChatRequest,
    db: Session = Depends(get_db),
    api_key: ApiKey = Depends(require_api_key),
):
    original = _extract_user_prompt(req.messages)
    optimized = optimize_prompt(original) if req.optimize else original
    model, intent, route_reason, complexity = route_model(optimized, req.model)

    messages = [{"role": m.role, "content": m.content} for m in req.messages]
    for m in reversed(messages):
        if m["role"] == "user":
            m["content"] = optimized
            break

    rag_chunks = []
    if req.use_rag:
        rag_chunks = await retrieve_chunks(db, optimized, k=3)
        rag_system = build_rag_system(rag_chunks)
        if rag_system:
            messages = [{"role": "system", "content": rag_system}, *messages]

    embedding: list = []
    cache_entry = None
    similarity = 0.0
    if req.use_cache:
        embedding = await embed_text(optimized)
        cache_entry, similarity = find_best_match(db, embedding)

    if not openai_configured() and cache_entry is None:
        raise HTTPException(
            status_code=503,
            detail="OPENAI_API_KEY is missing or still the placeholder. Set a real key in .env and restart.",
        )

    if cache_entry is not None:
        record_hit(db, cache_entry, similarity)
        input_tokens = cache_entry.input_tokens
        output_tokens = cache_entry.output_tokens
        actual_cost = 0.0
        baseline = estimate_cost(
            settings.default_complex_model, input_tokens, output_tokens
        )
        db_request = Request(
            prompt=optimized,
            response=cache_entry.response,
            model=cache_entry.model,
            provider=cache_entry.provider,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cost_usd=actual_cost,
            baseline_cost_usd=baseline,
            latency_ms=8,
            cache_hit=True,
            route_reason=f"Semantic cache hit ({similarity:.3f}) — skipped LLM",
            api_key_id=api_key.id,
            intent=intent,
            complexity_score=complexity,
            original_prompt=original,
            optimized_prompt=optimized,
            cache_entry_id=cache_entry.id,
            cache_similarity=similarity,
            fallback_used=False,
            embedding=embedding,
            status="success",
        )
        db.add(db_request)
        db.commit()
        db.refresh(db_request)
        return ChatResponse(
            id=f"optillm-{db_request.id}",
            model=cache_entry.model,
            provider=cache_entry.provider,
            choices=[
                ChatResponseChoice(
                    index=0,
                    message=ChatMessage(role="assistant", content=cache_entry.response),
                    finish_reason="stop",
                )
            ],
            usage=ChatResponseUsage(
                prompt_tokens=input_tokens,
                completion_tokens=output_tokens,
                total_tokens=input_tokens + output_tokens,
            ),
            cost_usd=actual_cost,
            baseline_cost_usd=baseline,
            latency_ms=8,
            cache_hit=True,
            cache_similarity=round(similarity, 4),
            route_reason=db_request.route_reason,
            intent=intent,
            complexity_score=complexity,
            original_prompt=original,
            optimized_prompt=optimized,
            fallback_used=False,
        )

    if not embedding and req.use_cache is False:
        # still store embedding for adaptive-routing logs
        try:
            embedding = await embed_text(optimized)
        except Exception:
            embedding = []

    import time

    start = time.time()
    try:
        result, fallback_used = await complete_with_fallback(
            model=model,
            messages=messages,
            temperature=req.temperature if req.temperature is not None else 0.7,
            max_tokens=req.max_tokens,
        )
    except Exception as exc:  # noqa: BLE001
        latency_ms = int((time.time() - start) * 1000)
        failed = Request(
            prompt=optimized,
            response="",
            model=model,
            provider="openai",
            latency_ms=latency_ms,
            cache_hit=False,
            route_reason=route_reason,
            api_key_id=api_key.id,
            intent=intent,
            complexity_score=complexity,
            original_prompt=original,
            optimized_prompt=optimized,
            embedding=embedding or None,
            status="error",
            error_message=str(exc),
        )
        db.add(failed)
        db.commit()
        raise HTTPException(status_code=502, detail=f"LLM provider error: {exc}") from exc

    latency_ms = int((time.time() - start) * 1000)
    content = result["content"]
    input_tokens = result["input_tokens"]
    output_tokens = result["output_tokens"]
    used_model = result["model"]
    provider = result["provider"]
    actual_cost = estimate_cost(used_model, input_tokens, output_tokens)
    baseline = estimate_cost(settings.default_complex_model, input_tokens, output_tokens)

    stored = None
    if req.use_cache:
        if not embedding:
            embedding = await embed_text(optimized)
        stored = store_entry(
            db,
            prompt=optimized,
            response=content,
            embedding=embedding,
            model=used_model,
            provider=provider,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cost_usd=actual_cost,
        )

    db_request = Request(
        prompt=optimized,
        response=content,
        model=used_model,
        provider=provider,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        cost_usd=actual_cost,
        baseline_cost_usd=baseline,
        latency_ms=latency_ms,
        cache_hit=False,
        route_reason=route_reason,
        api_key_id=api_key.id,
        intent=intent,
        complexity_score=complexity,
        original_prompt=original,
        optimized_prompt=optimized,
        cache_entry_id=stored.id if stored else None,
        cache_similarity=None,
        fallback_used=fallback_used,
        embedding=embedding or None,
        status="success",
    )
    db.add(db_request)
    db.commit()
    db.refresh(db_request)

    return ChatResponse(
        id=f"optillm-{db_request.id}",
        model=used_model,
        provider=provider,
        choices=[
            ChatResponseChoice(
                index=0,
                message=ChatMessage(role="assistant", content=content),
                finish_reason=result.get("finish_reason"),
            )
        ],
        usage=ChatResponseUsage(
            prompt_tokens=input_tokens,
            completion_tokens=output_tokens,
            total_tokens=input_tokens + output_tokens,
        ),
        cost_usd=actual_cost,
        baseline_cost_usd=baseline,
        latency_ms=latency_ms,
        cache_hit=False,
        cache_similarity=None,
        route_reason=route_reason,
        intent=intent,
        complexity_score=complexity,
        original_prompt=original,
        optimized_prompt=optimized,
        fallback_used=fallback_used,
    )


@app.get("/v1/requests", response_model=RequestList)
def list_requests(
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    cache_hit: Optional[bool] = None,
    model: Optional[str] = None,
    intent: Optional[str] = None,
):
    q = db.query(Request)
    if cache_hit is not None:
        q = q.filter(Request.cache_hit == cache_hit)
    if model:
        q = q.filter(Request.model == model)
    if intent:
        q = q.filter(Request.intent == intent)
    total = q.count()
    rows = q.order_by(Request.created_at.desc()).offset(offset).limit(limit).all()
    return RequestList(items=[RequestOut.model_validate(r) for r in rows], total=total)


@app.get("/v1/requests/{request_id}", response_model=RequestOut)
def get_request(request_id: int, db: Session = Depends(get_db)):
    row = db.query(Request).filter(Request.id == request_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Request not found")
    return RequestOut.model_validate(row)


@app.get("/v1/cache", response_model=CacheList)
def list_cache(
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    total = db.query(CacheEntry).count()
    rows = (
        db.query(CacheEntry)
        .order_by(CacheEntry.hit_count.desc(), CacheEntry.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    since = datetime.now(timezone.utc) - timedelta(days=7)
    recent = db.query(Request).filter(Request.created_at >= since)
    recent_total = recent.count()
    recent_hits = recent.filter(Request.cache_hit.is_(True)).count()
    hit_rate = (recent_hits / recent_total) if recent_total else 0.0
    return CacheList(
        items=[CacheEntryOut.model_validate(r) for r in rows],
        total=total,
        hit_rate_7d=round(hit_rate, 4),
        entry_count=total,
        threshold=settings.cache_similarity_threshold,
    )


@app.delete("/v1/cache/{entry_id}")
def delete_cache_entry(entry_id: int, db: Session = Depends(get_db)):
    row = db.query(CacheEntry).filter(CacheEntry.id == entry_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Cache entry not found")
    db.query(Request).filter(Request.cache_entry_id == entry_id).update(
        {Request.cache_entry_id: None}
    )
    db.delete(row)
    db.commit()
    return {"deleted": entry_id}


@app.delete("/v1/cache")
def clear_cache(db: Session = Depends(get_db)):
    db.query(Request).update({Request.cache_entry_id: None})
    deleted = db.query(CacheEntry).delete()
    db.commit()
    return {"deleted": deleted}


@app.get("/v1/analytics/overview", response_model=AnalyticsOverview)
def analytics_overview(
    db: Session = Depends(get_db),
    days: int = Query(14, ge=1, le=90),
):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    q = db.query(Request).filter(Request.created_at >= since)
    rows = q.all()
    total = len(rows)
    total_cost = sum(r.cost_usd or 0 for r in rows)
    baseline = sum(r.baseline_cost_usd or 0 for r in rows)
    hits = sum(1 for r in rows if r.cache_hit)
    latency = sum(r.latency_ms or 0 for r in rows)

    buckets: dict[str, dict] = {}
    models: dict[str, dict] = {}
    intents: dict[str, dict] = {}
    providers: dict[str, dict] = {}
    for r in rows:
        day = (r.created_at or datetime.now(timezone.utc)).date().isoformat()
        bucket = buckets.setdefault(
            day, {"requests": 0, "cost": 0.0, "saved": 0.0, "cache_hits": 0}
        )
        bucket["requests"] += 1
        bucket["cost"] += r.cost_usd or 0
        bucket["saved"] += max(0.0, (r.baseline_cost_usd or 0) - (r.cost_usd or 0))
        if r.cache_hit:
            bucket["cache_hits"] += 1

        m = models.setdefault(r.model or "unknown", {"count": 0, "cost": 0.0})
        m["count"] += 1
        m["cost"] += r.cost_usd or 0

        intent = r.intent or "unknown"
        i = intents.setdefault(intent, {"count": 0, "cost": 0.0})
        i["count"] += 1
        i["cost"] += r.cost_usd or 0

        p = providers.setdefault(r.provider or "unknown", {"count": 0, "cost": 0.0})
        p["count"] += 1
        p["cost"] += r.cost_usd or 0

    timeseries = [
        TimeseriesPoint(
            date=day,
            requests=v["requests"],
            cost=round(v["cost"], 6),
            saved=round(v["saved"], 6),
            cache_hits=v["cache_hits"],
        )
        for day, v in sorted(buckets.items())
    ]

    return AnalyticsOverview(
        total_requests=total,
        total_cost_usd=round(total_cost, 6),
        baseline_cost_usd=round(baseline, 6),
        cost_saved_usd=round(max(0.0, baseline - total_cost), 6),
        cache_hit_rate=round((hits / total) if total else 0.0, 4),
        avg_latency_ms=round((latency / total) if total else 0.0, 1),
        timeseries=timeseries,
        models=[
            NamedCount(name=k, count=v["count"], cost=round(v["cost"], 6))
            for k, v in sorted(models.items(), key=lambda kv: kv[1]["count"], reverse=True)
        ],
        intents=[
            NamedCount(name=k, count=v["count"], cost=round(v["cost"], 6))
            for k, v in sorted(intents.items(), key=lambda kv: kv[1]["count"], reverse=True)
        ],
        providers=[
            NamedCount(name=k, count=v["count"], cost=round(v["cost"], 6))
            for k, v in sorted(providers.items(), key=lambda kv: kv[1]["count"], reverse=True)
        ],
    )


@app.get("/v1/documents", response_model=List[DocumentOut])
def list_documents(db: Session = Depends(get_db)):
    rows = db.query(Document).order_by(Document.created_at.desc()).all()
    return [DocumentOut.model_validate(r) for r in rows]


@app.post("/v1/documents", response_model=DocumentOut)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(data) > 8 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 8MB)")
    try:
        doc = await ingest_document(
            db,
            filename=file.filename or "upload",
            content_type=file.content_type or "application/octet-stream",
            data=data,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return DocumentOut.model_validate(doc)


@app.delete("/v1/documents/{document_id}")
def delete_document(document_id: int, db: Session = Depends(get_db)):
    row = db.query(Document).filter(Document.id == document_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Document not found")
    db.delete(row)
    db.commit()
    return {"deleted": document_id}


# Silence unused import warning if engine is kept for health extensions
_ = engine, func
