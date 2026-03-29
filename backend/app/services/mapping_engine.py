from __future__ import annotations

from typing import Optional

from app.models import (
    ArchitectureIntent,
    ComponentType,
    Connection,
    DatabaseKind,
    ParsedComponent,
    ServiceMapping,
    SolutionArchetype,
)


BASE_SERVICE_CATALOG = {
    "azure": {
        "waf": {
            "service": "Azure Web Application Firewall",
            "category": "security",
            "rationale": "Adds managed edge protection, OWASP filtering, and policy-based request inspection for internet-facing traffic.",
        },
        "cdn": {
            "service": "Azure Front Door",
            "category": "edge",
            "rationale": "Accelerates global delivery and provides a single global ingress point for frontend and API traffic.",
        },
        "frontend": {
            "service": "Azure Static Web Apps",
            "category": "presentation",
            "rationale": "Hosts the frontend with managed deployment, global distribution, and strong integration with API backends.",
        },
        "authentication": {
            "service": "Microsoft Entra External ID",
            "category": "identity",
            "rationale": "Provides managed workforce or customer sign-in flows, federation, OAuth support, and identity policy controls.",
        },
        "api_gateway": {
            "service": "Azure API Management",
            "category": "api",
            "rationale": "Adds routing, throttling, policy enforcement, versioning, and a governed public API entry point.",
        },
        "backend_api": {
            "service": "Azure App Service",
            "category": "compute",
            "rationale": "Runs the API layer on managed, autoscalable web compute with enterprise-ready deployment slots and diagnostics.",
        },
        "cicd_pipeline": {
            "service": "GitHub Actions",
            "category": "delivery",
            "rationale": "Automates build, test, deployment, and environment promotion workflows for faster and safer releases.",
        },
        "database:relational": {
            "service": "Azure SQL Database",
            "category": "data",
            "rationale": "Handles transactional workloads with managed backups, high availability options, and built-in security controls.",
        },
        "database:document": {
            "service": "Azure Cosmos DB",
            "category": "data",
            "rationale": "Supports globally distributed document workloads with elastic throughput and low-latency access patterns.",
        },
        "cache": {
            "service": "Azure Cache for Redis",
            "category": "cache",
            "rationale": "Reduces latency and offloads repeated reads for session data and hot application paths.",
        },
        "queue": {
            "service": "Azure Service Bus",
            "category": "messaging",
            "rationale": "Decouples background processing and smooths traffic spikes through reliable managed messaging.",
        },
        "object_storage": {
            "service": "Azure Blob Storage",
            "category": "storage",
            "rationale": "Stores uploads, exports, logs, or generated files in durable and cost-effective object storage.",
        },
        "secrets": {
            "service": "Azure Key Vault",
            "category": "security",
            "rationale": "Centralizes secret storage, key management, and credential rotation outside application code.",
        },
        "private_network": {
            "service": "Azure Virtual Network",
            "category": "network",
            "rationale": "Provides network isolation boundaries and private connectivity to application and data services.",
        },
        "monitoring": {
            "service": "Azure Monitor",
            "category": "operations",
            "rationale": "Centralizes logs, metrics, tracing, alerting, and operational insights across the platform.",
        },
        "analytics": {
            "service": "Power BI Embedded",
            "category": "analytics",
            "rationale": "Delivers dashboards, findings views, and embedded analytical reporting to users or operators.",
        },
        "policy_engine": {
            "service": "Azure Policy",
            "category": "governance",
            "rationale": "Evaluates resources against guardrails and compliance requirements with policy-driven enforcement.",
        },
        "security_analytics": {
            "service": "Microsoft Sentinel",
            "category": "security",
            "rationale": "Correlates security signals, detections, incidents, and investigation workflows across the estate.",
        },
        "discovery": {
            "service": "Azure Resource Graph",
            "category": "control",
            "rationale": "Discovers resources across subscriptions and supports large-scale inventory and posture queries.",
        },
        "ai_model_gateway": {
            "service": "Azure OpenAI",
            "category": "ai",
            "rationale": "Provides managed model inference endpoints for copilots, agents, and AI-powered applications.",
        },
        "search": {
            "service": "Azure AI Search",
            "category": "ai",
            "rationale": "Supports retrieval, indexing, and vector search patterns for knowledge-grounded applications.",
        },
        "ml_platform": {
            "service": "Azure Machine Learning",
            "category": "ai",
            "rationale": "Supports model training, evaluation, lifecycle management, and ML platform workflows.",
        },
        "integration": {
            "service": "Azure Logic Apps",
            "category": "integration",
            "rationale": "Orchestrates connectors, workflows, and third-party system integrations with managed automation.",
        },
    },
    "aws": {
        "waf": {"service": "AWS WAF", "category": "security", "rationale": "Protects public endpoints with managed rule sets, bot filtering, and request inspection policies."},
        "cdn": {"service": "Amazon CloudFront", "category": "edge", "rationale": "Caches content at the edge and provides a globally distributed ingress layer for web traffic."},
        "frontend": {"service": "Amazon S3 Static Website", "category": "presentation", "rationale": "Serves frontend assets durably and pairs well with CloudFront for enterprise-scale web delivery."},
        "authentication": {"service": "Amazon Cognito", "category": "identity", "rationale": "Provides hosted sign-in, token issuance, federation, and user management for workforce or customer identity."},
        "api_gateway": {"service": "Amazon API Gateway", "category": "api", "rationale": "Offers a managed public API entry point with throttling, authorization, and policy controls."},
        "backend_api": {"service": "AWS Fargate", "category": "compute", "rationale": "Runs containerized APIs without server management and scales through a managed compute platform."},
        "cicd_pipeline": {"service": "GitHub Actions", "category": "delivery", "rationale": "Automates validation and deployment workflows across environments and service boundaries."},
        "database:relational": {"service": "Amazon RDS for PostgreSQL", "category": "data", "rationale": "Supports relational application data with managed backups, patching, and high availability features."},
        "database:document": {"service": "Amazon DynamoDB", "category": "data", "rationale": "Delivers a fully managed document-style data store with high-scale performance and low operations overhead."},
        "cache": {"service": "Amazon ElastiCache for Redis", "category": "cache", "rationale": "Improves hot-path latency for frequent reads, sessions, and shared ephemeral state."},
        "queue": {"service": "Amazon SQS", "category": "messaging", "rationale": "Buffers asynchronous workloads with durable, decoupled message processing."},
        "object_storage": {"service": "Amazon S3", "category": "storage", "rationale": "Stores generated assets, uploads, backups, and exports with highly durable object storage."},
        "secrets": {"service": "AWS Secrets Manager", "category": "security", "rationale": "Keeps credentials and connection secrets out of application code while supporting rotation workflows."},
        "private_network": {"service": "Amazon VPC", "category": "network", "rationale": "Creates the network boundary for private workloads, service segmentation, and controlled east-west traffic."},
        "monitoring": {"service": "Amazon CloudWatch", "category": "operations", "rationale": "Collects metrics, logs, alarms, and dashboards across the architecture."},
        "analytics": {"service": "Amazon QuickSight", "category": "analytics", "rationale": "Provides embedded dashboards and findings analysis across business or security workloads."},
        "policy_engine": {"service": "AWS Config", "category": "governance", "rationale": "Evaluates configuration state and compliance against declarative rules across the account estate."},
        "security_analytics": {"service": "Amazon Security Hub", "category": "security", "rationale": "Aggregates security findings, posture signals, and control status across AWS services."},
        "discovery": {"service": "AWS Config Aggregator", "category": "control", "rationale": "Builds a cross-account, cross-region inventory of resource configuration and changes."},
        "ai_model_gateway": {"service": "Amazon Bedrock", "category": "ai", "rationale": "Provides managed access to foundation models and inference orchestration."},
        "search": {"service": "Amazon OpenSearch Service", "category": "ai", "rationale": "Supports search, vector retrieval, and analytical indexing patterns."},
        "ml_platform": {"service": "Amazon SageMaker", "category": "ai", "rationale": "Supports ML development, training, inference, and model lifecycle operations."},
        "integration": {"service": "AWS Step Functions", "category": "integration", "rationale": "Coordinates workflows, connectors, and managed orchestration across services."},
    },
    "gcp": {
        "waf": {"service": "Cloud Armor", "category": "security", "rationale": "Applies WAF and DDoS mitigation policies at the edge for public application traffic."},
        "cdn": {"service": "Cloud CDN", "category": "edge", "rationale": "Improves latency by caching web traffic at the edge and reducing origin load."},
        "frontend": {"service": "Firebase Hosting", "category": "presentation", "rationale": "Deploys frontend assets quickly with managed global delivery and web-oriented hosting features."},
        "authentication": {"service": "Identity Platform", "category": "identity", "rationale": "Handles user sign-in, OAuth providers, and enterprise identity requirements through a managed service."},
        "api_gateway": {"service": "API Gateway", "category": "api", "rationale": "Adds a governed API facade with authentication, quotas, and routing control."},
        "backend_api": {"service": "Cloud Run", "category": "compute", "rationale": "Runs stateless APIs on demand with autoscaling and managed container deployment."},
        "cicd_pipeline": {"service": "Cloud Build", "category": "delivery", "rationale": "Automates builds, validations, and progressive deployments across managed environments."},
        "database:relational": {"service": "Cloud SQL for PostgreSQL", "category": "data", "rationale": "Provides a managed relational database for transactional application state with enterprise operations support."},
        "database:document": {"service": "Firestore", "category": "data", "rationale": "Fits document-oriented data models with a fully managed serverless storage layer."},
        "cache": {"service": "Memorystore for Redis", "category": "cache", "rationale": "Speeds up repeated reads and hot application lookups through managed Redis."},
        "queue": {"service": "Pub/Sub", "category": "messaging", "rationale": "Supports asynchronous event delivery across loosely coupled services."},
        "object_storage": {"service": "Cloud Storage", "category": "storage", "rationale": "Stores exported artifacts, uploads, and generated files in durable object storage."},
        "secrets": {"service": "Secret Manager", "category": "security", "rationale": "Stores secrets centrally and helps enforce separation between runtime code and credentials."},
        "private_network": {"service": "VPC Network", "category": "network", "rationale": "Creates the network perimeter and private service access path for backend and data services."},
        "monitoring": {"service": "Cloud Monitoring", "category": "operations", "rationale": "Captures metrics, logs, uptime signals, and alerting across the platform."},
        "analytics": {"service": "Looker", "category": "analytics", "rationale": "Delivers dashboards, semantic reporting, and analytical data experiences."},
        "policy_engine": {"service": "Organization Policy Service", "category": "governance", "rationale": "Applies centralized guardrails and policy constraints across the GCP estate."},
        "security_analytics": {"service": "Security Command Center", "category": "security", "rationale": "Aggregates findings, posture signals, and threat visibility across cloud resources."},
        "discovery": {"service": "Cloud Asset Inventory", "category": "control", "rationale": "Builds searchable inventory and history for cloud resources across projects and folders."},
        "ai_model_gateway": {"service": "Vertex AI", "category": "ai", "rationale": "Provides managed generative AI, model inference, and ML platform capabilities."},
        "search": {"service": "Vertex AI Search", "category": "ai", "rationale": "Provides enterprise search and retrieval workflows for grounded AI applications."},
        "ml_platform": {"service": "Vertex AI Workbench", "category": "ai", "rationale": "Supports ML development, experimentation, and managed training workflows."},
        "integration": {"service": "Application Integration", "category": "integration", "rationale": "Connects SaaS systems and orchestrates workflow-driven integrations."},
    },
}


ARCHETYPE_OVERRIDES = {
    SolutionArchetype.ai_security_and_compliance: {
        "azure": {
            "frontend": {"service": "Azure Static Web Apps", "category": "presentation", "rationale": "Provides the analyst and compliance workspace for posture findings and reports."},
            "backend_api": {"service": "Azure Container Apps", "category": "compute", "rationale": "Runs multi-tenant scan orchestration, evaluation services, and policy APIs with elastic scale."},
            "monitoring": {"service": "Log Analytics Workspace", "category": "operations", "rationale": "Centralizes scan telemetry, evidence trails, and cross-service diagnostics for the platform."},
            "analytics": {"service": "Power BI Embedded", "category": "analytics", "rationale": "Presents executive dashboards, evidence trends, and compliance reporting for customer tenants."},
            "policy_engine": {"service": "Azure Policy", "category": "governance", "rationale": "Evaluates cloud resources against required controls and flags non-compliant AI configurations."},
            "security_analytics": {"service": "Microsoft Defender for Cloud", "category": "security", "rationale": "Surfaces security posture, exposure, and recommendations that enrich the product's findings."},
            "discovery": {"service": "Azure Resource Graph", "category": "control", "rationale": "Enumerates AI and supporting resources across subscriptions for inventory and posture analysis."},
            "database:document": {"service": "Azure Cosmos DB", "category": "data", "rationale": "Stores findings, evidence metadata, and scan state with flexible document-style data models."},
            "object_storage": {"service": "Azure Blob Storage", "category": "storage", "rationale": "Stores exported reports, evidence artifacts, and longer-lived scan outputs."},
            "integration": {"service": "Azure Event Grid", "category": "integration", "rationale": "Distributes scan events, remediation triggers, and customer notification workflows."},
            "ai_model_gateway": {"service": "Azure OpenAI", "category": "ai", "rationale": "Supports AI-specific policy reasoning, evidence summarization, and remediation guidance workflows."},
        },
    },
    SolutionArchetype.ai_application_stack: {
        "azure": {
            "backend_api": {"service": "Azure Container Apps", "category": "compute", "rationale": "Runs API and orchestration services for AI applications with elastic scaling."},
            "search": {"service": "Azure AI Search", "category": "ai", "rationale": "Provides retrieval, indexing, and vector search for RAG-style solutions."},
            "ai_model_gateway": {"service": "Azure OpenAI", "category": "ai", "rationale": "Provides managed access to LLM inference for copilots and AI features."},
            "database:document": {"service": "Azure Cosmos DB", "category": "data", "rationale": "Stores conversation context, documents, or flexible application state for AI scenarios."},
        },
    },
    SolutionArchetype.data_processing_platform: {
        "azure": {
            "backend_api": {"service": "Azure Container Apps", "category": "compute", "rationale": "Hosts control APIs and transformation services for data workflows."},
            "queue": {"service": "Azure Event Hubs", "category": "messaging", "rationale": "Captures high-throughput event ingestion and streaming workloads."},
            "object_storage": {"service": "Azure Data Lake Storage Gen2", "category": "storage", "rationale": "Stores raw and processed data zones for analytical and batch processing."},
            "analytics": {"service": "Microsoft Fabric", "category": "analytics", "rationale": "Supports analytical exploration, reporting, and downstream business insight consumption."},
            "integration": {"service": "Azure Data Factory", "category": "integration", "rationale": "Orchestrates pipelines, connectors, and batch movement across data systems."},
        },
    },
    SolutionArchetype.transactional_saas: {
        "azure": {
            "backend_api": {"service": "Azure Container Apps", "category": "compute", "rationale": "Runs independently scalable application services and API workloads for modern transactional platforms."},
            "integration": {"service": "Azure Logic Apps", "category": "integration", "rationale": "Supports payment processors, fulfillment integrations, and event-driven external workflows."},
            "queue": {"service": "Azure Service Bus", "category": "messaging", "rationale": "Decouples orders, payments, inventory, and notification workflows with reliable asynchronous messaging."},
            "cache": {"service": "Azure Cache for Redis", "category": "cache", "rationale": "Improves read latency and protects the transactional database during high traffic bursts."},
            "cdn": {"service": "Azure Front Door", "category": "edge", "rationale": "Provides global entry, traffic acceleration, and edge routing for internet-scale commerce experiences."},
        },
    },
    SolutionArchetype.fintech_transaction_platform: {
        "azure": {
            "backend_api": {"service": "Azure Container Apps", "category": "compute", "rationale": "Runs transaction services with independent scaling boundaries for payments, ledgers, and platform APIs."},
            "api_gateway": {"service": "Azure API Management", "category": "api", "rationale": "Applies policy, throttling, and partner-facing governance for payment and transaction APIs."},
            "integration": {"service": "Azure Logic Apps", "category": "integration", "rationale": "Connects payment processors, fraud systems, and downstream settlement workflows."},
            "queue": {"service": "Azure Service Bus", "category": "messaging", "rationale": "Buffers transaction, reconciliation, and notification workflows with durable messaging."},
            "cache": {"service": "Azure Cache for Redis", "category": "cache", "rationale": "Protects critical read paths and hot account/session state during high transaction throughput."},
            "database:relational": {"service": "Azure SQL Database", "category": "data", "rationale": "Provides transactional consistency for payment and order records with managed availability features."},
            "monitoring": {"service": "Azure Monitor", "category": "operations", "rationale": "Supports operational telemetry, audit visibility, and alerting for regulated transaction systems."},
            "cdn": {"service": "Azure Front Door", "category": "edge", "rationale": "Provides secure global entry and fast edge routing for internet-facing payment experiences."},
        },
    },
    SolutionArchetype.internal_developer_portal: {
        "azure": {
            "frontend": {"service": "Azure Static Web Apps", "category": "presentation", "rationale": "Provides the internal portal, service catalog, and golden-path workspace for engineering teams."},
            "authentication": {"service": "Microsoft Entra ID", "category": "identity", "rationale": "Enforces workforce identity, SSO, and role-aware access to platform capabilities."},
            "backend_api": {"service": "Azure Container Apps", "category": "compute", "rationale": "Runs the platform API, scaffolding workflows, and self-service orchestration with elastic scale."},
            "database:relational": {"service": "Azure SQL Database", "category": "data", "rationale": "Stores catalog metadata, workflow state, and platform records with managed relational controls."},
            "database:document": {"service": "Azure Cosmos DB", "category": "data", "rationale": "Stores service catalog metadata, templates, provisioning state, and developer portal content flexibly."},
            "integration": {"service": "Azure Logic Apps", "category": "integration", "rationale": "Connects tickets, source control, cloud APIs, and provisioning workflows behind self-service actions."},
            "policy_engine": {"service": "Azure Policy", "category": "governance", "rationale": "Applies golden-path guardrails and platform governance to self-service provisioning flows."},
            "cicd_pipeline": {"service": "GitHub Actions", "category": "delivery", "rationale": "Automates template validation, environment promotion, and platform release workflows."},
        },
    },
}


class CloudMappingEngine:
    def map(self, intent: ArchitectureIntent) -> tuple[list[ServiceMapping], list[Connection]]:
        services = [self._map_component(intent, component) for component in intent.components]
        connections = self._build_connections(intent, services)
        return services, connections

    def _map_component(self, intent: ArchitectureIntent, component: ParsedComponent) -> ServiceMapping:
        catalog_key = self._catalog_key(component)
        template = self._resolve_template(intent.cloud.value, intent.archetype, catalog_key)
        return ServiceMapping(
            id=component.type.value,
            type=component.type,
            label=component.label,
            cloud_service=template["service"],
            category=template["category"],
            rationale=template["rationale"],
        )

    def _resolve_template(
        self,
        cloud: str,
        archetype: SolutionArchetype,
        catalog_key: str,
    ) -> dict[str, str]:
        overrides = ARCHETYPE_OVERRIDES.get(archetype, {}).get(cloud, {})
        if catalog_key in overrides:
            return overrides[catalog_key]
        return BASE_SERVICE_CATALOG[cloud][catalog_key]

    def _catalog_key(self, component: ParsedComponent) -> str:
        if component.type != ComponentType.database:
            return component.type.value
        kind = component.database_kind or DatabaseKind.relational
        return f"database:{kind.value}"

    def _build_connections(
        self,
        intent: ArchitectureIntent,
        services: list[ServiceMapping],
    ) -> list[Connection]:
        service_ids = {service.id for service in services}
        if intent.archetype == SolutionArchetype.ai_security_and_compliance:
            return self._build_ai_governance_connections(service_ids)
        if intent.archetype == SolutionArchetype.ai_application_stack:
            return self._build_ai_application_connections(service_ids)
        if intent.archetype == SolutionArchetype.data_processing_platform:
            return self._build_data_platform_connections(service_ids)
        if intent.archetype == SolutionArchetype.internal_developer_portal:
            return self._build_internal_portal_connections(service_ids)
        return self._build_default_connections(service_ids)

    def _build_default_connections(self, service_ids: set[str]) -> list[Connection]:
        connections: list[Connection] = []

        entry_target = self._first_present(service_ids, ["waf", "cdn", "frontend", "api_gateway", "backend_api"])
        if entry_target:
            connections.append(Connection(source="users", target=entry_target, label="HTTPS"))
        if "waf" in service_ids:
            downstream = self._first_present(service_ids, ["cdn", "frontend", "api_gateway", "backend_api"])
            if downstream and downstream != "waf":
                connections.append(Connection(source="waf", target=downstream, label="Filtered traffic"))
        if "cdn" in service_ids and "frontend" in service_ids:
            connections.append(Connection(source="cdn", target="frontend", label="Static assets"))
        if "frontend" in service_ids and "authentication" in service_ids:
            connections.append(Connection(source="frontend", target="authentication", label="Sign-in"))
        if "frontend" in service_ids and "api_gateway" in service_ids:
            connections.append(Connection(source="frontend", target="api_gateway", label="API calls"))
        elif "frontend" in service_ids and "backend_api" in service_ids:
            connections.append(Connection(source="frontend", target="backend_api", label="API calls"))
        if "api_gateway" in service_ids and "backend_api" in service_ids:
            connections.append(Connection(source="api_gateway", target="backend_api", label="Routed traffic"))
        if "backend_api" in service_ids and "cache" in service_ids:
            connections.append(Connection(source="backend_api", target="cache", label="Hot reads"))
        if "backend_api" in service_ids and "database" in service_ids:
            connections.append(Connection(source="backend_api", target="database", label="Reads/Writes"))
        if "backend_api" in service_ids and "queue" in service_ids:
            connections.append(Connection(source="backend_api", target="queue", label="Async jobs"))
        if "backend_api" in service_ids and "object_storage" in service_ids:
            connections.append(Connection(source="backend_api", target="object_storage", label="Files"))
        if "backend_api" in service_ids and "secrets" in service_ids:
            connections.append(Connection(source="backend_api", target="secrets", label="Secrets"))
        if "private_network" in service_ids:
            for private_target in ["backend_api", "database", "cache", "queue", "object_storage", "secrets", "integration"]:
                if private_target in service_ids:
                    connections.append(Connection(source="private_network", target=private_target, label="Private access", dashed=True))
        if "monitoring" in service_ids:
            for observed_service in ["waf", "api_gateway", "backend_api", "database", "queue", "cache", "secrets", "cicd_pipeline"]:
                if observed_service in service_ids:
                    connections.append(Connection(source="monitoring", target=observed_service, label="Telemetry", dashed=True))
        if "cicd_pipeline" in service_ids:
            for deploy_target, label in [
                ("frontend", "Deploys"),
                ("backend_api", "Releases"),
                ("integration", "Workflow delivery"),
            ]:
                if deploy_target in service_ids:
                    connections.append(Connection(source="cicd_pipeline", target=deploy_target, label=label, dashed=True))
        return connections

    def _build_ai_governance_connections(self, service_ids: set[str]) -> list[Connection]:
        connections = self._build_default_connections(service_ids)
        first = self._first_present(service_ids, ["frontend", "api_gateway", "backend_api"])
        if first and not any(c.source == "users" and c.target == first for c in connections):
            connections.append(Connection(source="users", target=first, label="HTTPS"))
        if "frontend" in service_ids and "analytics" in service_ids:
            connections.append(Connection(source="frontend", target="analytics", label="Findings"))
        if "backend_api" in service_ids and "discovery" in service_ids:
            connections.append(Connection(source="backend_api", target="discovery", label="Inventory scan"))
        if "backend_api" in service_ids and "policy_engine" in service_ids:
            connections.append(Connection(source="backend_api", target="policy_engine", label="Control evaluation"))
        if "discovery" in service_ids and "policy_engine" in service_ids:
            connections.append(Connection(source="discovery", target="policy_engine", label="Resource context"))
        if "policy_engine" in service_ids and "security_analytics" in service_ids:
            connections.append(Connection(source="policy_engine", target="security_analytics", label="Findings"))
        if "security_analytics" in service_ids and "analytics" in service_ids:
            connections.append(Connection(source="security_analytics", target="analytics", label="Dashboards"))
        if "backend_api" in service_ids and "object_storage" in service_ids:
            connections.append(Connection(source="backend_api", target="object_storage", label="Evidence"))
        if "backend_api" in service_ids and "database" in service_ids:
            connections.append(Connection(source="backend_api", target="database", label="Findings"))
        if "backend_api" in service_ids and "integration" in service_ids:
            connections.append(Connection(source="backend_api", target="integration", label="Alerts"))
        if "policy_engine" in service_ids and "ai_model_gateway" in service_ids:
            connections.append(Connection(source="policy_engine", target="ai_model_gateway", label="AI analysis", dashed=True))
        return self._dedupe_connections(connections)

    def _build_ai_application_connections(self, service_ids: set[str]) -> list[Connection]:
        connections = self._build_default_connections(service_ids)
        if "backend_api" in service_ids and "ai_model_gateway" in service_ids:
            connections.append(Connection(source="backend_api", target="ai_model_gateway", label="Model calls"))
        if "backend_api" in service_ids and "search" in service_ids:
            connections.append(Connection(source="backend_api", target="search", label="Retrieval"))
        if "ml_platform" in service_ids and "ai_model_gateway" in service_ids:
            connections.append(Connection(source="ml_platform", target="ai_model_gateway", label="Model lifecycle", dashed=True))
        return self._dedupe_connections(connections)

    def _build_data_platform_connections(self, service_ids: set[str]) -> list[Connection]:
        connections: list[Connection] = []
        first = self._first_present(service_ids, ["integration", "api_gateway", "backend_api"])
        if first:
            connections.append(Connection(source="users", target=first, label="Data requests"))
        if "integration" in service_ids and "queue" in service_ids:
            connections.append(Connection(source="integration", target="queue", label="Ingestion"))
        if "queue" in service_ids and "backend_api" in service_ids:
            connections.append(Connection(source="queue", target="backend_api", label="Processing"))
        if "backend_api" in service_ids and "object_storage" in service_ids:
            connections.append(Connection(source="backend_api", target="object_storage", label="Raw/curated data"))
        if "object_storage" in service_ids and "analytics" in service_ids:
            connections.append(Connection(source="object_storage", target="analytics", label="Reporting"))
        if "backend_api" in service_ids and "database" in service_ids:
            connections.append(Connection(source="backend_api", target="database", label="Metadata"))
        if "monitoring" in service_ids:
            for observed_service in ["integration", "queue", "backend_api", "object_storage", "analytics"]:
                if observed_service in service_ids:
                    connections.append(Connection(source="monitoring", target=observed_service, label="Telemetry", dashed=True))
        return connections

    def _build_internal_portal_connections(self, service_ids: set[str]) -> list[Connection]:
        connections = self._build_default_connections(service_ids)
        if "frontend" in service_ids and "backend_api" in service_ids and not any(
            connection.source == "frontend" and connection.target == "backend_api"
            for connection in connections
        ):
            connections.append(Connection(source="frontend", target="backend_api", label="Portal API"))
        if "backend_api" in service_ids and "integration" in service_ids:
            connections.append(Connection(source="backend_api", target="integration", label="Provisioning workflows"))
        if "backend_api" in service_ids and "policy_engine" in service_ids:
            connections.append(Connection(source="backend_api", target="policy_engine", label="Golden-path policies"))
        if "integration" in service_ids and "database" in service_ids:
            connections.append(Connection(source="integration", target="database", label="Catalog state"))
        if "cicd_pipeline" in service_ids and "policy_engine" in service_ids:
            connections.append(Connection(source="cicd_pipeline", target="policy_engine", label="Policy checks", dashed=True))
        return self._dedupe_connections(connections)

    def _dedupe_connections(self, connections: list[Connection]) -> list[Connection]:
        deduped: list[Connection] = []
        seen: set[tuple[str, str, str | None, bool]] = set()
        for connection in connections:
            key = (connection.source, connection.target, connection.label, connection.dashed)
            if key not in seen:
                deduped.append(connection)
                seen.add(key)
        return deduped

    def _first_present(self, service_ids: set[str], ordered_ids: list[str]) -> Optional[str]:
        for service_id in ordered_ids:
            if service_id in service_ids:
                return service_id
        return None
