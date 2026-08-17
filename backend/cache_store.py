"""Semantic cache: embed, nearest-neighbor lookup, store hits."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from config import settings
from embeddings import cosine_similarity
from models import CacheEntry


def find_best_match(
    db: Session,
    embedding: list[float],
    threshold: Optional[float] = None,
) -> tuple[Optional[CacheEntry], float]:
    cutoff = threshold if threshold is not None else settings.cache_similarity_threshold
    best: Optional[CacheEntry] = None
    best_score = -1.0
    for entry in db.query(CacheEntry).all():
        stored = entry.embedding or []
        score = cosine_similarity(embedding, stored)
        if score > best_score:
            best_score = score
            best = entry
    if best is None or best_score < cutoff:
        return None, best_score if best_score >= 0 else 0.0
    return best, best_score


def record_hit(db: Session, entry: CacheEntry, similarity: float) -> CacheEntry:
    entry.hit_count = (entry.hit_count or 0) + 1
    entry.last_similarity = similarity
    entry.last_hit_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(entry)
    return entry


def store_entry(
    db: Session,
    *,
    prompt: str,
    response: str,
    embedding: list[float],
    model: str,
    provider: str,
    input_tokens: int,
    output_tokens: int,
    cost_usd: float,
) -> CacheEntry:
    entry = CacheEntry(
        prompt=prompt,
        response=response,
        embedding=embedding,
        model=model,
        provider=provider,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        cost_usd=cost_usd,
        hit_count=0,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
