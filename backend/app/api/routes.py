from __future__ import annotations

from fastapi import APIRouter

from app.models import (
    ArchitectChatRequest,
    ArchitectChatResponse,
    ArchitectureRequest,
    ArchitectureResponse,
    ArchitectureRebuildRequest,
    AzureDeploymentPrepareResponse,
    AzureDeploymentRequest,
    AzureDeploymentResponse,
)
from app.services.architecture_service import architecture_service
from app.services.chat_service import chat_architect_service
from app.services.deployment_service import azure_deployment_service


router = APIRouter(prefix="/architectures", tags=["architectures"])


@router.post("/generate", response_model=ArchitectureResponse)
def generate_architecture(payload: ArchitectureRequest) -> ArchitectureResponse:
    return architecture_service.generate(payload)


@router.post("/rebuild", response_model=ArchitectureResponse)
def rebuild_architecture(payload: ArchitectureRebuildRequest) -> ArchitectureResponse:
    return architecture_service.rebuild(payload)


@router.post("/chat", response_model=ArchitectChatResponse)
def chat_with_architect(payload: ArchitectChatRequest) -> ArchitectChatResponse:
    return chat_architect_service.respond(payload)


@router.post("/deploy/azure", response_model=AzureDeploymentResponse)
def deploy_to_azure(payload: AzureDeploymentRequest) -> AzureDeploymentResponse:
    return azure_deployment_service.deploy(payload)


@router.post("/deploy/azure/prepare", response_model=AzureDeploymentPrepareResponse)
def prepare_azure_deployment(payload: AzureDeploymentRequest) -> AzureDeploymentPrepareResponse:
    return azure_deployment_service.prepare(payload)
