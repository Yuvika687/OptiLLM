"""Embeddings + cosine similarity.

Default is a local hashed n-gram vector so cache/RAG work without an
extra OpenAI embeddings bill. Set EMBEDDING_PROVIDER=openai to use
text-embedding-3-small when a real key is configured.
"""

from __future__ import annotations

import hashlib
import math
import re
from typing import List, Sequence

from config import settings

_client = None
DIM = 256
_TOKEN = re.compile(r"[a-z0-9]+")


def get_openai():
    global _client
    if _client is None:
        from openai import AsyncOpenAI

        _client = AsyncOpenAI(api_key=settings.openai_api_key)
    return _client


def cosine_similarity(a: Sequence[float], b: Sequence[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = 0.0
    na = 0.0
    nb = 0.0
    for x, y in zip(a, b):
        dot += x * y
        na += x * x
        nb += y * y
    if na <= 0 or nb <= 0:
        return 0.0
    return dot / math.sqrt(na * nb)


def local_embed(text: str) -> List[float]:
    vec = [0.0] * DIM
    tokens = _TOKEN.findall((text or "").lower())
    grams = list(tokens)
    grams.extend(f"{tokens[i]} {tokens[i + 1]}" for i in range(len(tokens) - 1))
    for gram in grams:
        digest = hashlib.sha256(gram.encode("utf-8")).digest()
        idx1 = int.from_bytes(digest[:2], "little") % DIM
        idx2 = int.from_bytes(digest[2:4], "little") % DIM
        vec[idx1] += 1.0
        vec[idx2] += 0.5
    norm = math.sqrt(sum(x * x for x in vec)) or 1.0
    return [x / norm for x in vec]


def openai_configured() -> bool:
    key = (settings.openai_api_key or "").strip()
    return bool(key) and "your-key" not in key and len(key) > 20


async def embed_text(text: str) -> List[float]:
    if settings.embedding_provider == "openai" and openai_configured():
        try:
            client = get_openai()
            result = await client.embeddings.create(
                model=settings.embedding_model,
                input=(text or " ")[:8000],
            )
            return list(result.data[0].embedding)
        except Exception:
            return local_embed(text)
    return local_embed(text)


async def embed_texts(texts: List[str]) -> List[List[float]]:
    return [await embed_text(t) for t in texts]
