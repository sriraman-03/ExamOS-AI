import json
import re
from app.config import settings

_client = None


def _get_client():
    global _client
    if _client is None and not settings.DEMO_MODE:
        import anthropic
        _client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    return _client


def call_llm(system_prompt: str, user_prompt: str, max_tokens: int = 1500) -> str:
    """Returns raw text from the LLM. Raises RuntimeError in demo mode so
    callers fall back to their rule-based generator."""
    if settings.DEMO_MODE:
        raise RuntimeError("DEMO_MODE: no ANTHROPIC_API_KEY configured")

    client = _get_client()
    response = client.messages.create(
        model=settings.LLM_MODEL,
        max_tokens=max_tokens,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    )
    parts = [b.text for b in response.content if getattr(b, "type", None) == "text"]
    return "\n".join(parts).strip()


def call_llm_json(system_prompt: str, user_prompt: str, max_tokens: int = 2000):
    """Calls the LLM expecting a JSON object/array back and parses it,
    stripping markdown code fences if the model added them."""
    raw = call_llm(system_prompt, user_prompt, max_tokens=max_tokens)
    cleaned = re.sub(r"^```(?:json)?|```$", "", raw.strip(), flags=re.MULTILINE).strip()
    match = re.search(r"(\{.*\}|\[.*\])", cleaned, re.DOTALL)
    if match:
        cleaned = match.group(1)
    return json.loads(cleaned)
