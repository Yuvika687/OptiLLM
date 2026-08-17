"""SQLAlchemy models for OptiLLM."""

from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ApiKey(Base):
    __tablename__ = "api_keys"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(128), nullable=False)
    key_prefix = Column(String(16), nullable=False, index=True)
    key_hash = Column(String(64), nullable=False, unique=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=_utcnow)
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    revoked_at = Column(DateTime(timezone=True), nullable=True)

    requests = relationship("Request", back_populates="api_key")


class CacheEntry(Base):
    __tablename__ = "cache_entries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    prompt = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    embedding = Column(JSON, nullable=False)
    model = Column(String(128), nullable=False)
    provider = Column(String(64), nullable=False, default="openai")
    input_tokens = Column(Integer, nullable=False, default=0)
    output_tokens = Column(Integer, nullable=False, default=0)
    cost_usd = Column(Float, nullable=False, default=0.0)
    hit_count = Column(Integer, nullable=False, default=0)
    last_similarity = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=_utcnow)
    last_hit_at = Column(DateTime(timezone=True), nullable=True)

    requests = relationship("Request", back_populates="cache_entry")


class Request(Base):
    __tablename__ = "requests"

    id = Column(Integer, primary_key=True, autoincrement=True)
    prompt = Column(Text, nullable=False)
    response = Column(Text, nullable=False, default="")
    model = Column(String(128), nullable=False)
    provider = Column(String(64), nullable=False, default="openai")
    input_tokens = Column(Integer, nullable=False, default=0)
    output_tokens = Column(Integer, nullable=False, default=0)
    cost_usd = Column(Float, nullable=False, default=0.0)
    baseline_cost_usd = Column(Float, nullable=False, default=0.0)
    latency_ms = Column(Integer, nullable=False, default=0)
    cache_hit = Column(Boolean, nullable=False, default=False)
    route_reason = Column(String(256), nullable=True)
    api_key_id = Column(Integer, ForeignKey("api_keys.id"), nullable=True)
    intent = Column(String(64), nullable=True)
    complexity_score = Column(Float, nullable=True)
    original_prompt = Column(Text, nullable=True)
    optimized_prompt = Column(Text, nullable=True)
    cache_entry_id = Column(Integer, ForeignKey("cache_entries.id"), nullable=True)
    cache_similarity = Column(Float, nullable=True)
    fallback_used = Column(Boolean, nullable=False, default=False)
    embedding = Column(JSON, nullable=True)
    status = Column(String(32), nullable=False, default="success")
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=_utcnow)

    api_key = relationship("ApiKey", back_populates="requests")
    cache_entry = relationship("CacheEntry", back_populates="requests")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, autoincrement=True)
    filename = Column(String(256), nullable=False)
    content_type = Column(String(128), nullable=False, default="application/pdf")
    size_bytes = Column(Integer, nullable=False, default=0)
    chunk_count = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), nullable=False, default=_utcnow)

    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    chunk_index = Column(Integer, nullable=False, default=0)
    text = Column(Text, nullable=False)
    embedding = Column(JSON, nullable=False)

    document = relationship("Document", back_populates="chunks")
