"""OptiLLM backend configuration — loaded from .env"""

from pathlib import Path

from pydantic_settings import BaseSettings

_ROOT = Path(__file__).resolve().parent.parent
_ENV_FILES = tuple(
    str(path)
    for path in (_ROOT / ".env", Path(__file__).resolve().parent / ".env")
    if path.exists()
)


class Settings(BaseSettings):
    openai_api_key: str = ""
    anthropic_api_key: str = ""

    database_url: str = "postgresql://optillm:optillm_dev@localhost:5432/optillm"

    backend_host: str = "0.0.0.0"
    backend_port: int = 8000

    cors_origins: str = "*"

    default_simple_model: str = "gpt-4o-mini"
    default_complex_model: str = "gpt-4o"
    complexity_threshold: float = 0.50

    cache_similarity_threshold: float = 0.92
    embedding_model: str = "text-embedding-3-small"
    embedding_provider: str = "local"

    model_config = {
        "env_file": _ENV_FILES or ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }

    @property
    def cors_origin_list(self) -> list[str]:
        raw = (self.cors_origins or "*").strip()
        if raw == "*":
            return ["*"]
        return [part.strip() for part in raw.split(",") if part.strip()]


settings = Settings()
