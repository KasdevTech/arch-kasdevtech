from __future__ import annotations

from typing import Optional

from app.models import (
    ArchitectureIntent,
    ComponentType,
    Connection,
    DatabaseKind,
    ParsedComponent,
    ServiceMapping,
)


SERVICE_CATALOG = {
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
    },
    "aws": {
        "waf": {
            "service": "AWS WAF",
            "category": "security",
            "rationale": "Protects public endpoints with managed rule sets, bot filtering, and request inspection policies.",
        },
        "cdn": {
            "service": "Amazon CloudFront",
            "category": "edge",
            "rationale": "Caches content at the edge and provides a globally distributed ingress layer for web traffic.",
        },
        "frontend": {
            "service": "Amazon S3 Static Website",
            "category": "presentation",
            "rationale": "Serves frontend assets durably and pairs well with CloudFront for enterprise-scale web delivery.",
        },
        "authentication": {
            "service": "Amazon Cognito",
            "category": "identity",
            "rationale": "Provides hosted sign-in, token issuance, federation, and user management for workforce or customer identity.",
        },
        "api_gateway": {
            "service": "Amazon API Gateway",
            "category": "api",
            "rationale": "Offers a managed public API entry point with throttling, authorization, and policy controls.",
        },
        "backend_api": {
            "service": "AWS Fargate",
            "category": "compute",
            "rationale": "Runs containerized APIs without server management and scales through a managed compute platform.",
        },
        "database:relational": {
            "service": "Amazon RDS for PostgreSQL",
            "category": "data",
            "rationale": "Supports relational application data with managed backups, patching, and high availability features.",
        },
        "database:document": {
            "service": "Amazon DynamoDB",
            "category": "data",
            "rationale": "Delivers a fully managed document-style data store with high-scale performance and low operations overhead.",
        },
        "cache": {
            "service": "Amazon ElastiCache for Redis",
            "category": "cache",
            "rationale": "Improves hot-path latency for frequent reads, sessions, and shared ephemeral state.",
        },
        "queue": {
            "service": "Amazon SQS",
            "category": "messaging",
            "rationale": "Buffers asynchronous workloads with durable, decoupled message processing.",
        },
        "object_storage": {
            "service": "Amazon S3",
            "category": "storage",
            "rationale": "Stores generated assets, uploads, backups, and exports with highly durable object storage.",
        },
        "secrets": {
            "service": "AWS Secrets Manager",
            "category": "security",
            "rationale": "Keeps credentials and connection secrets out of application code while supporting rotation workflows.",
        },
        "private_network": {
            "service": "Amazon VPC",
            "category": "network",
            "rationale": "Creates the network boundary for private workloads, service segmentation, and controlled east-west traffic.",
        },
        "monitoring": {
            "service": "Amazon CloudWatch",
            "category": "operations",
            "rationale": "Collects metrics, logs, alarms, and dashboards across the architecture.",
        },
    },
    "gcp": {
        "waf": {
            "service": "Cloud Armor",
            "category": "security",
            "rationale": "Applies WAF and DDoS mitigation policies at the edge for public application traffic.",
        },
        "cdn": {
            "service": "Cloud CDN",
            "category": "edge",
            "rationale": "Improves latency by caching web traffic at the edge and reducing origin load.",
        },
        "frontend": {
            "service": "Firebase Hosting",
            "category": "presentation",
            "rationale": "Deploys frontend assets quickly with managed global delivery and web-oriented hosting features.",
        },
        "authentication": {
            "service": "Identity Platform",
            "category": "identity",
            "rationale": "Handles user sign-in, OAuth providers, and enterprise identity requirements through a managed service.",
        },
        "api_gateway": {
            "service": "API Gateway",
            "category": "api",
            "rationale": "Adds a governed API facade with authentication, quotas, and routing control.",
        },
        "backend_api": {
            "service": "Cloud Run",
            "category": "compute",
            "rationale": "Runs stateless APIs on demand with autoscaling and managed container deployment.",
        },
        "database:relational": {
            "service": "Cloud SQL for PostgreSQL",
            "category": "data",
            "rationale": "Provides a managed relational database for transactional application state with enterprise operations support.",
        },
        "database:document": {
            "service": "Firestore",
            "category": "data",
            "rationale": "Fits document-oriented data models with a fully managed serverless storage layer.",
        },
        "cache": {
            "service": "Memorystore for Redis",
            "category": "cache",
            "rationale": "Speeds up repeated reads and hot application lookups through managed Redis.",
        },
        "queue": {
            "service": "Pub/Sub",
            "category": "messaging",
            "rationale": "Supports asynchronous event delivery across loosely coupled services.",
        },
        "object_storage": {
            "service": "Cloud Storage",
            "category": "storage",
            "rationale": "Stores exported artifacts, uploads, and generated files in durable object storage.",
        },
        "secrets": {
            "service": "Secret Manager",
            "category": "security",
            "rationale": "Stores secrets centrally and helps enforce separation between runtime code and credentials.",
        },
        "private_network": {
            "service": "VPC Network",
            "category": "network",
            "rationale": "Creates the network perimeter and private service access path for backend and data services.",
        },
        "monitoring": {
            "service": "Cloud Monitoring",
            "category": "operations",
            "rationale": "Captures metrics, logs, uptime signals, and alerting across the platform.",
        },
    },
}


class CloudMappingEngine:
    def map(self, intent: ArchitectureIntent) -> tuple[list[ServiceMapping], list[Connection]]:
        services = [self._map_component(intent.cloud.value, component) for component in intent.components]
        connections = self._build_connections(services)
        return services, connections

    def _map_component(self, cloud: str, component: ParsedComponent) -> ServiceMapping:
        catalog_key = self._catalog_key(component)
        template = SERVICE_CATALOG[cloud][catalog_key]

        return ServiceMapping(
            id=component.type.value,
            type=component.type,
            label=component.label,
            cloud_service=template["service"],
            category=template["category"],
            rationale=template["rationale"],
        )

    def _catalog_key(self, component: ParsedComponent) -> str:
        if component.type != ComponentType.database:
            return component.type.value

        kind = component.database_kind or DatabaseKind.relational
        return f"database:{kind.value}"

    def _build_connections(self, services: list[ServiceMapping]) -> list[Connection]:
        service_ids = {service.id for service in services}
        connections: list[Connection] = []

        entry_target = self._first_present(
            service_ids,
            ["waf", "cdn", "frontend", "api_gateway", "backend_api"],
        )
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
            for private_target in ["backend_api", "database", "cache", "queue", "object_storage", "secrets"]:
                if private_target in service_ids:
                    connections.append(
                        Connection(
                            source="private_network",
                            target=private_target,
                            label="Private access",
                            dashed=True,
                        ),
                    )

        if "monitoring" in service_ids:
            for observed_service in [
                "waf",
                "api_gateway",
                "backend_api",
                "database",
                "queue",
                "cache",
                "secrets",
            ]:
                if observed_service in service_ids:
                    connections.append(
                        Connection(
                            source="monitoring",
                            target=observed_service,
                            label="Telemetry",
                            dashed=True,
                        ),
                    )

        return connections

    def _first_present(self, service_ids: set[str], ordered_ids: list[str]) -> Optional[str]:
        for service_id in ordered_ids:
            if service_id in service_ids:
                return service_id
        return None
