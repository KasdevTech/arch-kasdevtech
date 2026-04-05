from __future__ import annotations

import re

from app.models import ArchitectureIntent, ComponentType, ServiceMapping


class TerraformStarterService:
    def build(self, intent: ArchitectureIntent, services: list[ServiceMapping]) -> str:
        if intent.cloud.value != "azure":
            return self._build_placeholder(intent, services)
        return self._build_azure(intent, services)

    def _build_azure(
        self,
        intent: ArchitectureIntent,
        services: list[ServiceMapping],
    ) -> str:
        workload_name = self._slug(intent.preferences.workload_name or intent.title or "ai-architect")
        compliance_frameworks = [framework.value for framework in intent.preferences.compliance_frameworks]
        lines = [
            'terraform {',
            '  required_version = ">= 1.6.0"',
            '  required_providers {',
            '    azurerm = {',
            '      source  = "hashicorp/azurerm"',
            '      version = "~> 4.0"',
            '    }',
            '    random = {',
            '      source  = "hashicorp/random"',
            '      version = "~> 3.6"',
            '    }',
            '  }',
            '}',
            '',
            'provider "azurerm" {',
            '  features {}',
            '  subscription_id = var.subscription_id',
            '  tenant_id       = var.tenant_id',
            '}',
            '',
            'variable "subscription_id" {',
            '  type = string',
            '}',
            '',
            'variable "tenant_id" {',
            '  type = string',
            '}',
            '',
            'variable "resource_group_name" {',
            '  type = string',
            '}',
            '',
            'variable "location" {',
            '  type = string',
            '}',
            '',
            'variable "tags" {',
            '  type = map(string)',
            '  default = {',
            '    managed_by = "kasdevtech-ai-architect"',
            '    landing_zone = "enterprise"',
            '  }',
            '}',
            '',
            'locals {',
            f'  workload_name      = "{workload_name}"',
            f'  environments       = {self._render_list(intent.preferences.environments)}',
            f'  multi_region       = {str(intent.preferences.multi_region).lower()}',
            f'  network_exposure   = "{intent.preferences.network_exposure.value}"',
            f'  data_sensitivity   = "{intent.preferences.data_sensitivity.value}"',
            f'  availability_tier  = "{intent.preferences.availability_tier.value}"',
            f'  tenancy_model      = "{intent.preferences.tenancy.value}"',
            f'  compliance_targets = {self._render_list(compliance_frameworks)}',
            '  static_web_app_location = contains(["westus2", "centralus", "eastus2", "westeurope", "eastasia"], lower(var.location)) ? lower(var.location) : "eastus2"',
            '  workload_compact   = substr(replace(local.workload_name, "-", ""), 0, 12)',
            '}',
            '',
            'data "azurerm_client_config" "current" {}',
            '',
            'resource "random_string" "suffix" {',
            '  length  = 4',
            '  upper   = false',
            '  lower   = true',
            '  numeric = true',
            '  special = false',
            '}',
            '',
            'resource "random_password" "sql_admin_password" {',
            '  length  = 24',
            '  special = true',
            '}',
            '',
        ]

        supported = {
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

        skipped: list[ServiceMapping] = []
        for service in services:
            if service.type not in supported:
                skipped.append(service)
                continue
            lines.extend(self._build_azure_resource_block(service))

        if skipped:
            lines.extend(
                [
                    '# --- Unsupported components (review and implement before production apply) ---',
                    *[
                        f'# {service.label} -> {service.cloud_service} is present in the architecture but not yet emitted as deployable Terraform.'
                        for service in skipped
                    ],
                ],
            )

        lines.extend(
            [
                '',
                '# Resource group bootstrap is handled by Ship before Terraform apply.',
                '# Next steps:',
                '# - Add advanced networking, private endpoints, and policy bindings.',
                '# - Replace starter SKUs with production capacity and HA settings.',
                '# - Add CI/CD and environment promotion around terraform plan/apply.',
            ],
        )
        return "\n".join(lines).strip()

    def _build_azure_resource_block(self, service: ServiceMapping) -> list[str]:
        key = self._tf_name(service.id)
        if service.type == ComponentType.frontend:
            return [
                f'# --- Component: {service.id} | {service.cloud_service} ---',
                f'resource "azurerm_static_web_app" "{key}" {{',
                f'  name                = "${{local.workload_name}}-{key}"',
                '  resource_group_name = var.resource_group_name',
                '  location            = local.static_web_app_location',
                '  sku_tier            = "Free"',
                '  sku_size            = "Free"',
                '  tags                = var.tags',
                '}',
                '',
            ]
        if service.type == ComponentType.object_storage:
            return [
                f'# --- Component: {service.id} | {service.cloud_service} ---',
                f'resource "azurerm_storage_account" "{key}" {{',
                f'  name                            = lower(substr("${{local.workload_compact}}{key[:8]}${{random_string.suffix.result}}", 0, 24))',
                '  resource_group_name             = var.resource_group_name',
                '  location                        = var.location',
                '  account_tier                    = "Standard"',
                '  account_replication_type        = "LRS"',
                '  account_kind                    = "StorageV2"',
                '  min_tls_version                 = "TLS1_2"',
                '  allow_nested_items_to_be_public = false',
                '  tags                            = var.tags',
                '}',
                '',
            ]
        if service.type == ComponentType.backend_api:
            return [
                f'# --- Component: {service.id} | {service.cloud_service} ---',
                f'resource "azurerm_service_plan" "{key}" {{',
                f'  name                = "${{local.workload_name}}-{key}-plan"',
                '  resource_group_name = var.resource_group_name',
                '  location            = var.location',
                '  os_type             = "Linux"',
                '  sku_name            = "B1"',
                '  tags                = var.tags',
                '}',
                '',
                f'resource "azurerm_linux_web_app" "{key}" {{',
                f'  name                = "${{local.workload_name}}-{key}"',
                '  resource_group_name = var.resource_group_name',
                '  location            = var.location',
                f'  service_plan_id     = azurerm_service_plan.{key}.id',
                '  https_only          = true',
                '  site_config {',
                '    always_on = false',
                '    application_stack {',
                '      python_version = "3.11"',
                '    }',
                '  }',
                '  app_settings = {',
                '    WEBSITES_ENABLE_APP_SERVICE_STORAGE = "false"',
                '  }',
                '  tags = var.tags',
                '}',
                '',
            ]
        if service.type == ComponentType.database:
            return [
                f'# --- Component: {service.id} | {service.cloud_service} ---',
                f'resource "azurerm_mssql_server" "{key}" {{',
                f'  name                         = lower(substr("${{local.workload_compact}}{key[:8]}sql${{random_string.suffix.result}}", 0, 63))',
                '  resource_group_name          = var.resource_group_name',
                '  location                     = var.location',
                '  version                      = "12.0"',
                '  administrator_login          = "kasdevadmin"',
                '  administrator_login_password = random_password.sql_admin_password.result',
                '  minimum_tls_version          = "1.2"',
                '  tags                         = var.tags',
                '}',
                '',
                f'resource "azurerm_mssql_database" "{key}" {{',
                f'  name      = "${{local.workload_name}}-{key}-db"',
                f'  server_id = azurerm_mssql_server.{key}.id',
                '  sku_name  = "Basic"',
                '  tags      = var.tags',
                '}',
                '',
            ]
        if service.type == ComponentType.private_network:
            return [
                f'# --- Component: {service.id} | {service.cloud_service} ---',
                f'resource "azurerm_virtual_network" "{key}" {{',
                f'  name                = "${{local.workload_name}}-{key}"',
                '  resource_group_name = var.resource_group_name',
                '  location            = var.location',
                '  address_space       = ["10.20.0.0/16"]',
                '  tags                = var.tags',
                '}',
                '',
                f'resource "azurerm_subnet" "{key}_default" {{',
                '  name                 = "default"',
                f'  resource_group_name  = var.resource_group_name',
                f'  virtual_network_name = azurerm_virtual_network.{key}.name',
                '  address_prefixes     = ["10.20.1.0/24"]',
                '}',
                '',
            ]
        if service.type == ComponentType.secrets:
            return [
                f'# --- Component: {service.id} | {service.cloud_service} ---',
                f'resource "azurerm_key_vault" "{key}" {{',
                f'  name                        = lower(substr("${{local.workload_compact}}{key[:8]}kv${{random_string.suffix.result}}", 0, 24))',
                '  location                    = var.location',
                '  resource_group_name         = var.resource_group_name',
                '  tenant_id                   = data.azurerm_client_config.current.tenant_id',
                '  sku_name                    = "standard"',
                '  purge_protection_enabled    = false',
                '  soft_delete_retention_days  = 7',
                '  enable_rbac_authorization   = true',
                '  tags                        = var.tags',
                '}',
                '',
            ]
        if service.type == ComponentType.queue:
            return [
                f'# --- Component: {service.id} | {service.cloud_service} ---',
                f'resource "azurerm_servicebus_namespace" "{key}" {{',
                f'  name                = "${{local.workload_name}}-{key}"',
                '  location            = var.location',
                '  resource_group_name = var.resource_group_name',
                '  sku                 = "Basic"',
                '  tags                = var.tags',
                '}',
                '',
            ]
        if service.type == ComponentType.monitoring:
            return [
                f'# --- Component: {service.id} | {service.cloud_service} ---',
                f'resource "azurerm_log_analytics_workspace" "{key}" {{',
                f'  name                = "${{local.workload_name}}-{key}"',
                '  location            = var.location',
                '  resource_group_name = var.resource_group_name',
                '  sku                 = "PerGB2018"',
                '  retention_in_days   = 30',
                '  tags                = var.tags',
                '}',
                '',
            ]
        if service.type == ComponentType.cache:
            return [
                f'# --- Component: {service.id} | {service.cloud_service} ---',
                f'resource "azurerm_redis_cache" "{key}" {{',
                f'  name                = "${{local.workload_name}}-{key}"',
                '  location            = var.location',
                '  resource_group_name = var.resource_group_name',
                '  capacity            = 0',
                '  family              = "C"',
                '  sku_name            = "Basic"',
                '  minimum_tls_version = "1.2"',
                '  tags                = var.tags',
                '}',
                '',
            ]
        return []

    def _build_placeholder(
        self,
        intent: ArchitectureIntent,
        services: list[ServiceMapping],
    ) -> str:
        lines = [
            '# Terraform starter output is currently production-ready only for Azure direct deploy.',
            f'# Cloud: {intent.cloud.value}',
            '# Services in this architecture:',
            *[f'# - {service.label}: {service.cloud_service}' for service in services],
        ]
        return "\n".join(lines)

    def _render_list(self, values: list[str]) -> str:
        return "[" + ", ".join(f'"{value}"' for value in values) + "]"

    def _slug(self, value: str) -> str:
        normalized = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
        return normalized or "ai-architect"

    def _tf_name(self, value: str) -> str:
        normalized = re.sub(r"[^a-zA-Z0-9_]+", "_", value).strip("_").lower()
        if normalized and normalized[0].isdigit():
            normalized = f"svc_{normalized}"
        return normalized or "service"
