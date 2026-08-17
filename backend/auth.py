"""API key generation and verification."""

import hashlib
import secrets
from datetime import datetime, timezone
from typing import Optional

from fastapi import Header, HTTPException, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import ApiKey


def _hash_key(secret: str) -> str:
    return hashlib.sha256(secret.encode("utf-8")).hexdigest()


def generate_secret() -> str:
    return "ollm_" + secrets.token_hex(24)


def create_api_key(db: Session, name: str) -> tuple[ApiKey, str]:
    secret = generate_secret()
    row = ApiKey(
        name=name.strip(),
        key_prefix=secret[:12],
        key_hash=_hash_key(secret),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row, secret


def revoke_api_key(db: Session, key_id: int) -> ApiKey:
    row = db.query(ApiKey).filter(ApiKey.id == key_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="API key not found")
    if row.revoked_at is None:
        row.revoked_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(row)
    return row


def resolve_api_key(db: Session, secret: str) -> Optional[ApiKey]:
    if not secret:
        return None
    row = db.query(ApiKey).filter(ApiKey.key_hash == _hash_key(secret)).first()
    if not row or row.revoked_at is not None:
        return None
    row.last_used_at = datetime.now(timezone.utc)
    db.commit()
    return row


def require_api_key(
    x_api_key: Optional[str] = Header(default=None, alias="X-API-Key"),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
) -> ApiKey:
    secret = x_api_key
    if not secret and authorization:
        if authorization.lower().startswith("bearer "):
            secret = authorization[7:].strip()
        else:
            secret = authorization.strip()
    if not secret:
        raise HTTPException(status_code=401, detail="Missing API key. Pass X-API-Key.")
    key = resolve_api_key(db, secret)
    if not key:
        raise HTTPException(status_code=401, detail="Invalid or revoked API key")
    return key
