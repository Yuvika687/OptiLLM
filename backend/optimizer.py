"""Cheap prompt cleanup — strip filler before embed/route/call."""

import re

_LEADING = re.compile(
    r"^\s*((hi|hello|hey|yo|greetings|good (morning|afternoon|evening))"
    r"[\s,.!]*)+",
    re.I,
)
_POLITE = re.compile(
    r"\b(please|kindly|if you (don't|do not) mind|would you|could you|"
    r"can you (please )?|i (just )?want you to|i need you to|"
    r"i would like you to)\b[:,]?\s*",
    re.I,
)
_THANKS = re.compile(
    r"\b(thanks( in advance)?|thank you( so much)?|cheers)[.!?]*$",
    re.I,
)
_FILLER = re.compile(
    r"\b(just |basically |actually |simply |really )\b",
    re.I,
)


def optimize_prompt(prompt: str) -> str:
    text = prompt.strip()
    text = _LEADING.sub("", text)
    text = _POLITE.sub("", text)
    text = _THANKS.sub("", text)
    text = _FILLER.sub("", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    cleaned = text.strip(" \n\t,.-")
    return cleaned or prompt.strip()
