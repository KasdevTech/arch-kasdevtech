from __future__ import annotations

import json
import shutil
import subprocess
import tempfile
from pathlib import Path

from fastapi import HTTPException

from app.models import (
    ArchitectureIntent,
    ArchitecturePreferences,
    AzureAuthenticationMode,
    AzureDeploymentPlanItem,
    AzureDeploymentPrepareResponse,
    AzureDeploymentRequest,
    AzureDeploymentResponse,
    CloudProvider,
    ComponentType,
    ParsedComponent,
    SolutionArchetype,
    SolutionDomain,
)
from app.services.iac_service import TerraformStarterService


class AzureDeploymentService:
    SUPPORTED_TERRAFORM_TYPES = {
        ComponentType.frontend,
        ComponentType.object_storage,
        ComponentType.backend_api,
        ComponentType.database,
        ComponentType.private_network,
        ComponentType.secrets,
        ComponentType.queue,
        ComponentType.monitoring,
        ComponentType.cache,
    }
    STATIC_WEBAPP_REGIONS = {"westus2", "centralus", "eastus2", "westeurope", "eastasia"}

    def prepare(self, payload: AzureDeploymentRequest) -> AzureDeploymentPrepareResponse:
        plan_items = self._plan_items(payload)
        deployable = [item for item in plan_items if item.supported]
        skipped = [item for item in plan_items if not item.supported]
        warnings = [item.note for item in plan_items if item.note]
        summary = (
            f"Prepared {len(deployable)} deployable resources for {payload.profile.resource_group}"
            + (f" with {len(skipped)} skipped." if skipped else ".")
        )
        return AzureDeploymentPrepareResponse(
            status="prepared",
            summary=summary,
            resource_group=payload.profile.resource_group,
            location=payload.profile.location,
            deployable_count=len(deployable),
            skipped_count=len(skipped),
            plan_items=plan_items,
            command_preview=self._command_preview(payload),
            warnings=warnings,
        )

    def deploy(self, payload: AzureDeploymentRequest) -> AzureDeploymentResponse:
        az_path = shutil.which("az")
        terraform_path = shutil.which("terraform")

        if not az_path:
            raise HTTPException(status_code=500, detail="Azure CLI is not installed.")
        if not terraform_path:
            raise HTTPException(status_code=500, detail="Terraform is not installed.")
        if payload.cloud != CloudProvider.azure:
            raise HTTPException(status_code=400, detail="Direct deployment is only implemented for Azure right now.")

        logs: list[str] = []

        self._run(
            self._login_command(payload, az_path),
            logs,
            sensitive_values=[
                payload.profile.client_secret or "",
                payload.profile.client_id or "",
            ],
        )
        self._run(
            [az_path, "account", "set", "--subscription", payload.profile.subscription_id],
            logs,
        )
        self._run(
            [
                az_path,
                "group",
                "create",
                "--name",
                payload.profile.resource_group,
                "--location",
                payload.profile.location,
            ],
            logs,
        )

        with tempfile.TemporaryDirectory(prefix="ai-arch-tf-") as temp_dir:
            workdir = Path(temp_dir)
            self._write_terraform_bundle(payload, workdir)
            self._run(
                [terraform_path, "init", "-input=false"],
                logs,
                cwd=workdir,
            )
            self._run(
                [terraform_path, "plan", "-input=false", "-out=tfplan"],
                logs,
                cwd=workdir,
            )
            self._run(
                [terraform_path, "apply", "-input=false", "-auto-approve", "tfplan"],
                logs,
                cwd=workdir,
            )

        plan_items = self._plan_items(payload)
        deployed_services = [item.resource_type for item in plan_items if item.supported]
        skipped_services = [item.resource_type for item in plan_items if not item.supported]

        return AzureDeploymentResponse(
            status="deployed" if not skipped_services else "partial",
            resource_group=payload.profile.resource_group,
            location=payload.profile.location,
            deployment_name=payload.profile.deployment_name,
            logs=logs,
            deployed_services=deployed_services,
            skipped_services=skipped_services,
        )

    def _plan_items(self, payload: AzureDeploymentRequest) -> list[AzureDeploymentPlanItem]:
        title_slug = self._slug(payload.project_title)
        items = [
            AzureDeploymentPlanItem(
                service_id="resource-group",
                title=payload.profile.resource_group,
                resource_type="Resource Group",
                location=payload.profile.location,
                action="Create or update deployment resource group",
                supported=True,
            ),
        ]
        for service in payload.services:
            if service.type == ComponentType.frontend:
                location = self._static_web_app_location(payload.profile.location)
                note = None
                if location != payload.profile.location.lower():
                    note = f"Static Web Apps are not available in {payload.profile.location}; deploying this resource in {location}."
                items.append(
                    AzureDeploymentPlanItem(
                        service_id=service.id,
                        title=f"{title_slug}-frontend",
                        resource_type="Azure Static Web App",
                        location=location,
                        action=f"Deploy {service.label}",
                        supported=True,
                        note=note,
                    ),
                )
                continue
            if service.type == ComponentType.object_storage:
                items.append(self._item(service, f"{title_slug}-storage", "Storage Account", payload.profile.location))
                continue
            if service.type == ComponentType.backend_api:
                items.append(self._item(service, f"{title_slug}-backend-api", "App Service + Plan", payload.profile.location))
                continue
            if service.type == ComponentType.database:
                items.append(self._item(service, f"{title_slug}-database", "Azure SQL", payload.profile.location))
                continue
            if service.type == ComponentType.private_network:
                items.append(self._item(service, f"{title_slug}-vnet", "Virtual Network", payload.profile.location))
                continue
            if service.type == ComponentType.secrets:
                items.append(self._item(service, f"{title_slug}-kv", "Key Vault", payload.profile.location))
                continue
            if service.type == ComponentType.queue:
                items.append(self._item(service, f"{title_slug}-sb", "Service Bus Namespace", payload.profile.location))
                continue
            if service.type == ComponentType.monitoring:
                items.append(self._item(service, f"{title_slug}-log", "Log Analytics Workspace", payload.profile.location))
                continue
            if service.type == ComponentType.cache:
                items.append(self._item(service, f"{title_slug}-redis", "Azure Cache for Redis", payload.profile.location))
                continue
            items.append(
                AzureDeploymentPlanItem(
                    service_id=service.id,
                    title=service.label,
                    resource_type=service.cloud_service,
                    location=payload.profile.location,
                    action="Skip direct deployment",
                    supported=False,
                    note="Direct Terraform deployment is not implemented for this service yet.",
                ),
            )
        return items

    def _item(self, service, title: str, resource_type: str, location: str) -> AzureDeploymentPlanItem:
        return AzureDeploymentPlanItem(
            service_id=service.id,
            title=title,
            resource_type=resource_type,
            location=location,
            action=f"Deploy {service.label}",
            supported=True,
        )

    def _command_preview(self, payload: AzureDeploymentRequest) -> list[str]:
        return [
            "az login ...",
            f'az account set --subscription "{payload.profile.subscription_id}"',
            f'az group create --name "{payload.profile.resource_group}" --location "{payload.profile.location}"',
            "terraform init -input=false",
            "terraform plan -input=false -out=tfplan",
            "terraform apply -input=false -auto-approve tfplan",
        ]

    def _write_terraform_bundle(
        self,
        payload: AzureDeploymentRequest,
        workdir: Path,
    ) -> None:
        intent = ArchitectureIntent(
            title=payload.project_title,
            summary=f"Deployable Terraform bundle for {payload.project_title}",
            cloud=payload.cloud,
            domain=SolutionDomain.enterprise_application,
            archetype=SolutionArchetype.transactional_saas,
            preferences=payload.preferences if payload.preferences else ArchitecturePreferences(),
            priorities=[],
            patterns=[],
            assumptions=[],
            components=[
                ParsedComponent(type=service.type, label=service.label)
                for service in payload.services
            ],
        )
        generated_iac = TerraformStarterService().build(intent, payload.services)
        (workdir / "main.tf").write_text(generated_iac, encoding="utf-8")
        (workdir / "terraform.tfvars.json").write_text(
            json.dumps(
                {
                    "subscription_id": payload.profile.subscription_id,
                    "tenant_id": payload.profile.tenant_id,
                    "resource_group_name": payload.profile.resource_group,
                    "location": payload.profile.location,
                    "tags": {
                        "managed_by": "kasdevtech-ai-architect",
                        "deployment_name": payload.profile.deployment_name,
                    },
                },
                indent=2,
            ),
            encoding="utf-8",
        )

    def _login_command(
        self,
        payload: AzureDeploymentRequest,
        az_path: str,
    ) -> list[str]:
        if payload.profile.auth_mode == AzureAuthenticationMode.service_principal:
            if not (
                payload.profile.client_id
                and payload.profile.client_secret
                and payload.profile.tenant_id
            ):
                raise HTTPException(
                    status_code=400,
                    detail="Client ID, client secret, and tenant ID are required for service principal auth.",
                )

            return [
                az_path,
                "login",
                "--service-principal",
                "--username",
                payload.profile.client_id,
                "--password",
                payload.profile.client_secret,
                "--tenant",
                payload.profile.tenant_id,
            ]

        return [
            az_path,
            "login",
            "--tenant",
            payload.profile.tenant_id,
        ]

    def _static_web_app_location(self, location: str) -> str:
        normalized = location.strip().lower()
        return normalized if normalized in self.STATIC_WEBAPP_REGIONS else "eastus2"

    def _slug(self, value: str) -> str:
        return "".join(
            character.lower() if character.isalnum() else "-"
            for character in value
        ).strip("-") or "architecture"

    def _run(
        self,
        command: list[str],
        logs: list[str],
        *,
        cwd: Path | None = None,
        sensitive_values: list[str] | None = None,
    ) -> None:
        safe_command = " ".join(command)
        for secret in sensitive_values or []:
            if secret:
                safe_command = safe_command.replace(secret, "****")
        logs.append(f"$ {safe_command}")

        completed = subprocess.run(
            command,
            capture_output=True,
            text=True,
            check=False,
            cwd=str(cwd) if cwd else None,
        )

        if completed.stdout.strip():
            logs.append(completed.stdout.strip())
        if completed.stderr.strip():
            logs.append(completed.stderr.strip())

        if completed.returncode != 0:
            raise HTTPException(
                status_code=500,
                detail="\n".join(logs[-12:]),
            )


azure_deployment_service = AzureDeploymentService()
