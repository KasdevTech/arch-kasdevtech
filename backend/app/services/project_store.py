from __future__ import annotations

import json
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import HTTPException

from app.models import (
    ArchitectureResponse,
    ProjectHistoryResponse,
    ProjectSaveRequest,
    ProjectVersionSummary,
)


class ProjectStoreService:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._storage_path = Path(__file__).resolve().parents[2] / "data" / "projects.json"
        self._storage_path.parent.mkdir(parents=True, exist_ok=True)

    def list_projects(self) -> list[ArchitectureResponse]:
        payload = self._read()
        projects = [self._deserialize_project(item["current"]) for item in payload.get("projects", [])]
        projects.sort(key=lambda item: item.updated_at, reverse=True)
        return projects

    def get_project(self, project_id: str) -> ArchitectureResponse:
        record = self._find_record(project_id)
        return self._deserialize_project(record["current"])

    def save_project(self, payload: ProjectSaveRequest) -> ArchitectureResponse:
        with self._lock:
            data = self._read()
            now = datetime.now(timezone.utc)
            architecture = payload.architecture.model_copy(
                update={"updated_at": now},
                deep=True,
            )
            architecture.created_at = architecture.created_at or now

            records = data.setdefault("projects", [])
            existing = next(
                (item for item in records if item["project_id"] == architecture.request_id),
                None,
            )

            if existing is None:
                architecture.version_number = 1
                records.append(
                    {
                        "project_id": architecture.request_id,
                        "current": self._serialize_project(architecture),
                        "versions": [self._build_version_entry(architecture, payload.change_note)],
                    },
                )
            else:
                current = self._deserialize_project(existing["current"])
                next_version = current.version_number + 1
                architecture.version_number = next_version
                existing["current"] = self._serialize_project(architecture)
                existing.setdefault("versions", []).append(
                    self._build_version_entry(architecture, payload.change_note),
                )

            self._write(data)
            return architecture

    def delete_project(self, project_id: str) -> None:
        with self._lock:
            data = self._read()
            projects = data.setdefault("projects", [])
            next_projects = [
                item for item in projects if item["project_id"] != project_id
            ]
            if len(next_projects) == len(projects):
                raise HTTPException(status_code=404, detail="Project not found.")
            data["projects"] = next_projects
            self._write(data)

    def update_canvas_layout(self, project_id: str, canvas_layout: dict) -> ArchitectureResponse:
        with self._lock:
            data = self._read()
            record = self._find_record(project_id, payload=data)
            architecture = self._deserialize_project(record["current"])
            architecture.canvas_layout = canvas_layout
            architecture.updated_at = datetime.now(timezone.utc)
            record["current"] = self._serialize_project(architecture)
            self._write(data)
            return architecture

    def update_deployment_profile(self, project_id: str, profile, run) -> ArchitectureResponse:
        with self._lock:
            data = self._read()
            record = self._find_record(project_id, payload=data)
            architecture = self._deserialize_project(record["current"])
            architecture.azure_deployment_profile = profile
            architecture.deployment_run = run
            architecture.updated_at = datetime.now(timezone.utc)
            record["current"] = self._serialize_project(architecture)
            self._write(data)
            return architecture

    def history(self, project_id: str) -> ProjectHistoryResponse:
        record = self._find_record(project_id)
        versions = [
            ProjectVersionSummary(**item)
            for item in sorted(
                record.get("versions", []),
                key=lambda version: version["version_number"],
                reverse=True,
            )
        ]
        current = self._deserialize_project(record["current"])
        return ProjectHistoryResponse(
            project_id=project_id,
            current_version=current.version_number,
            versions=versions,
        )

    def restore(self, project_id: str, version_id: str) -> ArchitectureResponse:
        with self._lock:
            data = self._read()
            record = self._find_record(project_id, payload=data)
            versions = record.get("versions", [])
            version = next((item for item in versions if item["version_id"] == version_id), None)
            if version is None:
                raise HTTPException(status_code=404, detail="Version not found.")

            restored = self._deserialize_project(version["architecture"])
            restored.updated_at = datetime.now(timezone.utc)
            restored.version_number = self._deserialize_project(record["current"]).version_number + 1
            record["current"] = self._serialize_project(restored)
            versions.append(self._build_version_entry(restored, f"Restored from version {version['version_number']}"))
            self._write(data)
            return restored

    def _build_version_entry(self, architecture: ArchitectureResponse, change_note: str | None) -> dict:
        saved_at = architecture.updated_at or datetime.now(timezone.utc)
        return {
            "version_id": str(uuid.uuid4()),
            "version_number": architecture.version_number,
            "saved_at": saved_at.isoformat(),
            "title": architecture.title,
            "summary": architecture.summary,
            "change_note": change_note,
            "architecture": self._serialize_project(architecture),
        }

    def _find_record(self, project_id: str, *, payload: dict | None = None) -> dict:
        data = payload or self._read()
        record = next(
            (item for item in data.get("projects", []) if item["project_id"] == project_id),
            None,
        )
        if record is None:
            raise HTTPException(status_code=404, detail="Project not found.")
        return record

    def _read(self) -> dict:
        if not self._storage_path.exists():
            return {"projects": []}

        raw = self._storage_path.read_text(encoding="utf-8").strip()
        if not raw:
            return {"projects": []}
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError as exc:
            raise HTTPException(status_code=500, detail="Project storage is unreadable.") from exc
        if "projects" not in payload:
            payload["projects"] = []
        return payload

    def _write(self, payload: dict) -> None:
        self._storage_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    def _serialize_project(self, architecture: ArchitectureResponse) -> dict:
        return architecture.model_dump(mode="json")

    def _deserialize_project(self, payload: dict) -> ArchitectureResponse:
        return ArchitectureResponse(**payload)


project_store_service = ProjectStoreService()
