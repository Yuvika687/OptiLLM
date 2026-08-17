"""PDF ingest + top-k chunk retrieval."""

from __future__ import annotations

from io import BytesIO

from pypdf import PdfReader
from sqlalchemy.orm import Session

from embeddings import cosine_similarity, embed_text, embed_texts
from models import Document, DocumentChunk

CHUNK_SIZE = 800
CHUNK_OVERLAP = 120


def extract_pdf_text(data: bytes) -> str:
    reader = PdfReader(BytesIO(data))
    pages = []
    for page in reader.pages:
        pages.append(page.extract_text() or "")
    return "\n\n".join(pages).strip()


def chunk_text(text: str) -> list[str]:
    cleaned = " ".join(text.split())
    if not cleaned:
        return []
    chunks: list[str] = []
    start = 0
    while start < len(cleaned):
        end = min(len(cleaned), start + CHUNK_SIZE)
        chunk = cleaned[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end >= len(cleaned):
            break
        start = end - CHUNK_OVERLAP
    return chunks


async def ingest_document(
    db: Session,
    *,
    filename: str,
    content_type: str,
    data: bytes,
) -> Document:
    if content_type == "application/pdf" or filename.lower().endswith(".pdf"):
        text = extract_pdf_text(data)
    else:
        text = data.decode("utf-8", errors="replace")
    pieces = chunk_text(text)
    if not pieces:
        raise ValueError("No extractable text in document")
    vectors = await embed_texts(pieces)
    doc = Document(
        filename=filename,
        content_type=content_type or "application/octet-stream",
        size_bytes=len(data),
        chunk_count=len(pieces),
    )
    db.add(doc)
    db.flush()
    for i, (piece, vector) in enumerate(zip(pieces, vectors)):
        db.add(
            DocumentChunk(
                document_id=doc.id,
                chunk_index=i,
                text=piece,
                embedding=vector,
            )
        )
    db.commit()
    db.refresh(doc)
    return doc


async def retrieve_chunks(db: Session, query: str, k: int = 3) -> list[dict]:
    chunks = db.query(DocumentChunk).all()
    if not chunks:
        return []
    query_vec = await embed_text(query)
    scored = []
    for chunk in chunks:
        score = cosine_similarity(query_vec, chunk.embedding or [])
        scored.append((score, chunk))
    scored.sort(key=lambda item: item[0], reverse=True)
    top = scored[:k]
    results = []
    for score, chunk in top:
        results.append(
            {
                "document_id": chunk.document_id,
                "chunk_index": chunk.chunk_index,
                "text": chunk.text,
                "score": round(score, 4),
            }
        )
    return results


def build_rag_system(chunks: list[dict]) -> str:
    if not chunks:
        return ""
    parts = [
        "Use the following retrieved document excerpts when they are relevant. "
        "If they are not relevant, ignore them."
    ]
    for i, chunk in enumerate(chunks, start=1):
        parts.append(f"[Excerpt {i}]\n{chunk['text']}")
    return "\n\n".join(parts)
