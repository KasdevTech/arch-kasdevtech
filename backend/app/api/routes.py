from __future__ import annotations

from fastapi import APIRouter

from app.models import ArchitectureRequest, ArchitectureResponse
from app.services.architecture_service import architecture_service


router = APIRouter(prefix="/architectures", tags=["architectures"])


@router.post("/generate", response_model=ArchitectureResponse)
def generate_architecture(payload: ArchitectureRequest) -> ArchitectureResponse:
    return architecture_service.generate(payload)

