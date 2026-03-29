from __future__ import annotations

from app.models import ArchitectureIntent, ServiceMapping


PROVIDER_BLOCKS = {
    "azure": """terraform {
  required_version = ">= 1.6.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }
}

provider "azurerm" {
  features {}
}""",
    "aws": """terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.primary_region
}""",
    "gcp": """terraform {
  required_version = ">= 1.6.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }
}

provider "google" {
  project = var.gcp_project_id
  region  = var.primary_region
}""",
}


class TerraformStarterService:
    def build(self, intent: ArchitectureIntent, services: list[ServiceMapping]) -> str:
        provider_block = PROVIDER_BLOCKS[intent.cloud.value]
        environments = intent.preferences.environments
        compliance_frameworks = [framework.value for framework in intent.preferences.compliance_frameworks]

        lines = [
            provider_block,
            "",
            'locals {',
            f'  workload_name      = "{(intent.preferences.workload_name or "ai-architect").lower().replace(" ", "-")}"',
            f'  environments       = {self._render_list(environments)}',
            f'  multi_region       = {str(intent.preferences.multi_region).lower()}',
            f'  network_exposure   = "{intent.preferences.network_exposure.value}"',
            f'  data_sensitivity   = "{intent.preferences.data_sensitivity.value}"',
            f'  availability_tier  = "{intent.preferences.availability_tier.value}"',
            f'  tenancy_model      = "{intent.preferences.tenancy.value}"',
            f'  compliance_targets = {self._render_list(compliance_frameworks)}',
            "}",
            "",
            'variable "primary_region" {',
            "  type    = string",
            '  default = "eastus"',
            "}",
            "",
            'variable "secondary_region" {',
            "  type    = string",
            '  default = "westus"',
            "}",
            "",
            'variable "tags" {',
            "  type = map(string)",
            "  default = {",
            '    managed_by = "ai-cloud-architecture-generator"',
            '    landing_zone = "enterprise"',
            "  }",
            "}",
            "",
            "# Example enterprise pattern: instantiate modules per environment.",
            'module "platform" {',
            '  source = "./modules/platform-foundation"',
            "  environments      = local.environments",
            "  primary_region    = var.primary_region",
            "  secondary_region  = var.secondary_region",
            "  multi_region      = local.multi_region",
            "  network_exposure  = local.network_exposure",
            "  availability_tier = local.availability_tier",
            "  tags              = var.tags",
            "}",
            "",
        ]

        for service in services:
            lines.extend(
                [
                    f'module "{service.id}" {{',
                    f'  source = "./modules/{service.id}"',
                    f'  name   = "${{local.workload_name}}-{service.id}"',
                    "  environments      = local.environments",
                    "  primary_region    = var.primary_region",
                    "  secondary_region  = var.secondary_region",
                    "  multi_region      = local.multi_region",
                    "  network_exposure  = local.network_exposure",
                    f'  # Maps to: {service.cloud_service}',
                    f'  # Purpose: {service.rationale}',
                    "  tags              = var.tags",
                    "}",
                    "",
                ],
            )

        lines.extend(
            [
                "# Recommended follow-up:",
                "# - Wire policy as code for tags, encryption, and network rules.",
                "# - Connect modules to secrets, observability, and CI/CD pipelines.",
                "# - Replace placeholder module sources with production-grade reusable modules.",
            ],
        )

        return "\n".join(lines).strip()

    def _render_list(self, values: list[str]) -> str:
        return "[" + ", ".join(f'"{value}"' for value in values) + "]"
