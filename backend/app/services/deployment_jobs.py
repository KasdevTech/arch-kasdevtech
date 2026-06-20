from __future__ import annotations

import json
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import HTTPException

from app.models import (
    AzureDeploymentRequest,
    DeploymentJobResponse,
    DeploymentJobStatus,
    DeploymentRun,
)
from app.services.deployment_service import azure_deployment_service
from app.services.project_store import project_store_service


class DeploymentJobService:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._storage_path = Path(__file__).resolve().parents[2] / "data" / "deployment_jobs.json"
        self._storage_path.parent.mkdir(parents=True, exist_ok=True)

    def list_active_jobs(self) -> list[DeploymentJobResponse]:
        jobs = self._read_jobs()
        active = [
            DeploymentJobResponse(**job)
            for job in jobs
            if job["status"] in {DeploymentJobStatus.queued.value, DeploymentJobStatus.running.value}
        ]
        active.sort(key=lambda item: item.updated_at, reverse=True)
        return active

    def create_job(self, payload: AzureDeploymentRequest) -> DeploymentJobResponse:
        job = DeploymentJobResponse(
            job_id=str(uuid.uuid4()),
            project_id=payload.project_id,
            project_title=payload.project_title,
            cloud=payload.cloud,
            status=DeploymentJobStatus.queued,
            summary=f"Queued deployment for {payload.profile.resource_group}.",
            resource_group=payload.profile.resource_group,
            location=payload.profile.location,
            deployment_name=payload.profile.deployment_name,
            logs=azure_deployment_service.prepare(payload).command_preview,
        )
        with self._lock:
            data = self._read()
            data.setdefault("jobs", []).append(job.model_dump(mode="json"))
            self._write(data)
        worker = threading.Thread(
            target=self._run_job,
            args=(job.job_id, payload),
            daemon=True,
        )
        worker.start()
        return job

    def get_job(self, job_id: str) -> DeploymentJobResponse:
        jobs = self._read_jobs()
        job = next((item for item in jobs if item["job_id"] == job_id), None)
        if job is None:
            raise HTTPException(status_code=404, detail="Deployment job not found.")
        return DeploymentJobResponse(**job)

    def _run_job(self, job_id: str, payload: AzureDeploymentRequest) -> None:
        self._update_job(
            job_id,
            status=DeploymentJobStatus.running,
            summary=f"Deploying to resource group {payload.profile.resource_group}...",
        )
        try:
            response = azure_deployment_service.deploy(payload)
            final_status = (
                DeploymentJobStatus.partial
                if response.status == "partial"
                else DeploymentJobStatus.deployed
            )
            self._update_job(
                job_id,
                status=final_status,
                summary=(
                    f"Deployment completed with skips in {response.resource_group}."
                    if response.skipped_services
                    else f"Deployment completed for {response.resource_group}."
                ),
                logs=response.logs,
                deployed_services=response.deployed_services,
                skipped_services=response.skipped_services,
            )
            project_store_service.update_deployment_profile(
                payload.project_id,
                payload.profile,
                DeploymentRun(
                    status="ready" if response.skipped_services else "deployed",
                    summary=(
                        f"Deployment completed with skips in {response.resource_group}."
                        if response.skipped_services
                        else f"Deployment completed for {response.resource_group}."
                    ),
                    generated_at=response.deployed_at,
                    command_preview=response.logs,
                ),
            )
        except HTTPException as exc:
            detail = exc.detail if isinstance(exc.detail, str) else json.dumps(exc.detail)
            self._update_job(
                job_id,
                status=DeploymentJobStatus.failed,
                summary="Deployment failed. Review logs.",
                logs=detail.splitlines(),
            )
            project_store_service.update_deployment_profile(
                payload.project_id,
                payload.profile,
                DeploymentRun(
                    status="failed",
                    summary="Deployment failed. Review logs.",
                    generated_at=datetime.now(timezone.utc),
                    command_preview=detail.splitlines(),
                ),
            )

    def _update_job(
        self,
        job_id: str,
        *,
        status: DeploymentJobStatus,
        summary: str,
        logs: list[str] | None = None,
        deployed_services: list[str] | None = None,
        skipped_services: list[str] | None = None,
    ) -> None:
        with self._lock:
            data = self._read()
            jobs = data.setdefault("jobs", [])
            job = next((item for item in jobs if item["job_id"] == job_id), None)
            if job is None:
                return
            job["status"] = status.value
            job["summary"] = summary
            job["updated_at"] = datetime.now(timezone.utc).isoformat()
            if logs is not None:
                job["logs"] = logs
            if deployed_services is not None:
                job["deployed_services"] = deployed_services
            if skipped_services is not None:
                job["skipped_services"] = skipped_services
            self._write(data)

    def _read_jobs(self) -> list[dict]:
        return self._read().get("jobs", [])

    def _read(self) -> dict:
        if not self._storage_path.exists():
            return {"jobs": []}
        raw = self._storage_path.read_text(encoding="utf-8").strip()
        if not raw:
            return {"jobs": []}
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return {"jobs": []}

    def _write(self, payload: dict) -> None:
        self._storage_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


deployment_job_service = DeploymentJobService()
