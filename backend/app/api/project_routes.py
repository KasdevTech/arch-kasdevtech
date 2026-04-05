from __future__ import annotations

from fastapi import APIRouter

from app.models import (
    ArchitectureResponse,
    CanvasLayoutUpdateRequest,
    DeploymentProfileUpdateRequest,
    ProjectHistoryResponse,
    ProjectSaveRequest,
)
from app.services.project_store import project_store_service


router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[ArchitectureResponse])
def list_projects() -> list[ArchitectureResponse]:
    return project_store_service.list_projects()


@router.get("/{project_id}", response_model=ArchitectureResponse)
def get_project(project_id: str) -> ArchitectureResponse:
    return project_store_service.get_project(project_id)


@router.put("/{project_id}", response_model=ArchitectureResponse)
def save_project(project_id: str, payload: ProjectSaveRequest) -> ArchitectureResponse:
    architecture = payload.architecture.model_copy(update={"request_id": project_id}, deep=True)
    return project_store_service.save_project(
        ProjectSaveRequest(
            architecture=architecture,
            change_note=payload.change_note,
        ),
    )


@router.patch("/{project_id}/canvas-layout", response_model=ArchitectureResponse)
def update_canvas_layout(
    project_id: str,
    payload: CanvasLayoutUpdateRequest,
) -> ArchitectureResponse:
    return project_store_service.update_canvas_layout(project_id, payload.canvas_layout)


@router.patch("/{project_id}/deployment-profile", response_model=ArchitectureResponse)
def update_deployment_profile(
    project_id: str,
    payload: DeploymentProfileUpdateRequest,
) -> ArchitectureResponse:
    return project_store_service.update_deployment_profile(project_id, payload.profile, payload.run)


@router.get("/{project_id}/history", response_model=ProjectHistoryResponse)
def get_project_history(project_id: str) -> ProjectHistoryResponse:
    return project_store_service.history(project_id)


@router.post("/{project_id}/restore/{version_id}", response_model=ArchitectureResponse)
def restore_project_version(project_id: str, version_id: str) -> ArchitectureResponse:
    return project_store_service.restore(project_id, version_id)


@router.delete("/{project_id}")
def delete_project(project_id: str) -> dict[str, str]:
    project_store_service.delete_project(project_id)
    return {"status": "deleted"}
