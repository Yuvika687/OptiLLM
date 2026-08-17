"""Rule-based intent + complexity classifier and model router."""

from __future__ import annotations

import re

from config import settings

_CODING = re.compile(
    r"\b(code|python|javascript|typescript|sql|function|class|bug|refactor|"
    r"implement|api|regex|algorithm|compile|stack.?trace)\b",
    re.I,
)
_SUMMARY = re.compile(r"\b(summar(y|ise|ize)|tldr|eli5|brief|overview)\b", re.I)
_REASONING = re.compile(
    r"\b(analy[sz]e|reason|compare|trade.?off|prove|derive|architect|"
    r"design|evaluate|why|how does|step by step)\b",
    re.I,
)
_CLASSIFY = re.compile(r"\b(classif(y|ication)|sentiment|label|categor)\b", re.I)

_COMPLEX_HINTS = re.compile(
    r"\b(production|robust|architect|multi-step|trade.?off|prove|"
    r"formally|distributed|concurrency|optimiz|security|edge.?case)\b",
    re.I,
)
_SIMPLE_HINTS = re.compile(
    r"\b(yes or no|one sentence|translate|synonym|capitalize|list 3)\b",
    re.I,
)


def classify_intent(prompt: str) -> str:
    if _CODING.search(prompt):
        return "coding"
    if _SUMMARY.search(prompt):
        return "summary"
    if _CLASSIFY.search(prompt):
        return "classification"
    if _REASONING.search(prompt):
        return "reasoning"
    return "chat"


def complexity_score(prompt: str) -> float:
    score = 0.15
    length = len(prompt)
    if length > 200:
        score += 0.15
    if length > 800:
        score += 0.2
    if length > 2000:
        score += 0.15
    hints = _COMPLEX_HINTS.findall(prompt)
    if hints:
        score += min(0.35, 0.08 * len(hints))
    if prompt.count("```") >= 2 or "def " in prompt or "class " in prompt:
        score += 0.1
    if prompt.count("?") >= 3:
        score += 0.1
    if _SIMPLE_HINTS.search(prompt) and length < 400:
        score -= 0.25
    return max(0.0, min(1.0, round(score, 3)))


def route_model(prompt: str, override: str | None = None) -> tuple[str, str, str, float]:
    """Return (model, intent, reason, complexity)."""
    intent = classify_intent(prompt)
    score = complexity_score(prompt)
    if override:
        return override, intent, f"Explicit override to {override}", score

    if score >= settings.complexity_threshold:
        model = settings.default_complex_model
        reason = (
            f"Complexity {score:.2f} >= {settings.complexity_threshold:.2f} "
            f"({intent}) → {model}"
        )
    else:
        model = settings.default_simple_model
        reason = (
            f"Complexity {score:.2f} < {settings.complexity_threshold:.2f} "
            f"({intent}) → {model}"
        )
    return model, intent, reason, score


def router_rules() -> list[str]:
    return [
        f"Prompts with complexity ≥ {settings.complexity_threshold} go to {settings.default_complex_model}.",
        f"Everything else goes to {settings.default_simple_model}.",
        "Complexity rises with length, production/architecture keywords, and multi-question prompts.",
        "Complexity falls for short yes/no, translate, and one-sentence asks.",
        "Intent is tagged as coding, summary, reasoning, classification, or chat for analytics.",
    ]
