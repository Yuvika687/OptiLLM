"""LLM provider calls with retry + model/provider fallback."""

from __future__ import annotations

import json
from typing import Any

import httpx
from openai import APIError

from config import settings
from embeddings import get_openai


async def call_openai(
    *,
    model: str,
    messages: list[dict[str, str]],
    temperature: float,
    max_tokens: int | None,
) -> dict[str, Any]:
    client = get_openai()
    completion = await client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    choice = completion.choices[0]
    usage = completion.usage
    return {
        "content": choice.message.content or "",
        "finish_reason": choice.finish_reason,
        "input_tokens": usage.prompt_tokens if usage else 0,
        "output_tokens": usage.completion_tokens if usage else 0,
        "model": completion.model or model,
        "provider": "openai",
    }


async def call_anthropic(
    *,
    model: str,
    messages: list[dict[str, str]],
    temperature: float,
    max_tokens: int | None,
) -> dict[str, Any]:
    system = " ".join(m["content"] for m in messages if m["role"] == "system")
    converted = [
        {"role": m["role"], "content": m["content"]}
        for m in messages
        if m["role"] in ("user", "assistant")
    ]
    payload = {
        "model": model,
        "max_tokens": max_tokens or 1024,
        "temperature": temperature,
        "messages": converted,
    }
    if system:
        payload["system"] = system
    async with httpx.AsyncClient(timeout=60) as client:
        res = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": settings.anthropic_api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            content=json.dumps(payload),
        )
        res.raise_for_status()
        data = res.json()
    text_parts = [b.get("text", "") for b in data.get("content", []) if b.get("type") == "text"]
    usage = data.get("usage") or {}
    return {
        "content": "".join(text_parts),
        "finish_reason": data.get("stop_reason"),
        "input_tokens": usage.get("input_tokens", 0),
        "output_tokens": usage.get("output_tokens", 0),
        "model": data.get("model", model),
        "provider": "anthropic",
    }


async def complete_with_fallback(
    *,
    model: str,
    messages: list[dict[str, str]],
    temperature: float,
    max_tokens: int | None,
) -> tuple[dict[str, Any], bool]:
    """Try primary model, retry once, then fall back to the other configured model."""
    last_error: Exception | None = None
    for attempt in range(2):
        try:
            return await call_openai(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            ), False
        except Exception as exc:  # noqa: BLE001 — we fall back below
            last_error = exc

    alt = (
        settings.default_simple_model
        if model == settings.default_complex_model
        else settings.default_complex_model
    )
    if alt != model:
        try:
            result = await call_openai(
                model=alt,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return result, True
        except Exception as exc:  # noqa: BLE001
            last_error = exc

    if settings.anthropic_api_key:
        try:
            result = await call_anthropic(
                model="claude-3-5-sonnet-latest",
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return result, True
        except Exception as exc:  # noqa: BLE001
            last_error = exc

    detail = str(last_error) if last_error else "LLM provider error"
    if isinstance(last_error, APIError):
        detail = last_error.message or detail
    raise RuntimeError(detail)
