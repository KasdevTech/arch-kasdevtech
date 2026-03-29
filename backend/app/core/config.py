from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    app_name: str
    app_version: str
    api_prefix: str
    cors_origins: list[str]
    intent_backend: str
    openai_api_key: str
    openai_model: str
    llm_service_base_url: str
    llm_service_api_key: str
    llm_service_model: str


def get_settings() -> Settings:
    raw_origins = os.getenv(
        "AI_ARCHITECT_CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    )

    origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

    return Settings(
        app_name="AI Cloud Architecture Generator",
        app_version="0.1.0",
        api_prefix="/api/v1",
        cors_origins=origins,
        intent_backend=os.getenv("AI_ARCHITECT_INTENT_BACKEND", "heuristic").strip().lower(),
        openai_api_key=os.getenv("OPENAI_API_KEY", "").strip(),
        openai_model=os.getenv("AI_ARCHITECT_OPENAI_MODEL", "gpt-4.1-mini").strip(),
        llm_service_base_url=os.getenv(
            "AI_ARCHITECT_LLM_BASE_URL",
            "https://kasdevtech-llm.onrender.com/v1",
        ).strip().rstrip("/"),
        llm_service_api_key=os.getenv("AI_ARCHITECT_LLM_API_KEY", "").strip(),
        llm_service_model=os.getenv("AI_ARCHITECT_LLM_MODEL", "qwen2.5-0.5b").strip(),
    )


settings = get_settings()
