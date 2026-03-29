from __future__ import annotations

from fastapi import APIRouter

from app.models import (
    ArchitectChatRequest,
    ArchitectChatResponse,
    ArchitectureRequest,
    ArchitectureResponse,
)
from app.services.architecture_service import architecture_service
from app.services.chat_service import chat_architect_service


router = APIRouter(prefix="/architectures", tags=["architectures"])


@router.post("/generate", response_model=ArchitectureResponse)
def generate_architecture(payload: ArchitectureRequest) -> ArchitectureResponse:
    return architecture_service.generate(payload)


@router.post("/chat", response_model=ArchitectChatResponse)
def chat_with_architect(payload: ArchitectChatRequest) -> ArchitectChatResponse:
    return chat_architect_service.respond(payload)
