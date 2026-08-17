"""Cost estimation for OpenAI (and optional Anthropic) models."""

MODEL_PRICING = {
    "gpt-4o-mini": (0.00015, 0.0006),
    "gpt-4o": (0.0025, 0.01),
    "gpt-4-turbo": (0.01, 0.03),
    "gpt-4": (0.03, 0.06),
    "gpt-3.5-turbo": (0.0005, 0.0015),
    "o1-mini": (0.003, 0.012),
    "o1-preview": (0.015, 0.06),
    "claude-3-5-sonnet": (0.003, 0.015),
    "claude-3-haiku": (0.00025, 0.00125),
}

FALLBACK_PRICING = (0.01, 0.03)


def _lookup(model: str) -> tuple[float, float]:
    pricing = MODEL_PRICING.get(model)
    if pricing is None:
        for prefix, prices in MODEL_PRICING.items():
            if model.startswith(prefix):
                return prices
        return FALLBACK_PRICING
    return pricing


def estimate_cost(model: str, input_tokens: int, output_tokens: int) -> float:
    inp_price, out_price = _lookup(model)
    cost = (input_tokens / 1000.0 * inp_price) + (output_tokens / 1000.0 * out_price)
    return round(cost, 8)
