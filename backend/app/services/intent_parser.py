from __future__ import annotations

import json
import re

from app.core.config import settings
from app.models import (
    ArchitectureIntent,
    ArchitecturePreferences,
    ArchitectureRequest,
    AvailabilityTier,
    CloudProvider,
    ComplianceFramework,
    ComponentType,
    DataSensitivity,
    DatabaseKind,
    NetworkExposure,
    ParsedComponent,
    UserScale,
)
from app.services.prompt_templates import INTENT_SYSTEM_PROMPT


class IntentParser:
    COMPONENT_KEYWORDS = {
        ComponentType.frontend: [
            "frontend",
            "frontend app",
            "web app",
            "web application",
            "spa",
            "react",
            "next.js",
            "nextjs",
            "vue",
            "angular",
            "dashboard",
            "portal",
            "ui",
        ],
        ComponentType.backend_api: [
            "backend",
            "backend api",
            "api",
            "rest api",
            "graphql",
            "service",
            "server",
            "microservice",
        ],
        ComponentType.database: [
            "database",
            "db",
            "postgres",
            "postgresql",
            "mysql",
            "sql",
            "store data",
            "persistent",
        ],
        ComponentType.authentication: [
            "auth",
            "authentication",
            "oauth",
            "openid",
            "login",
            "sign in",
            "signup",
            "sso",
            "identity",
        ],
        ComponentType.cdn: [
            "cdn",
            "edge",
            "global delivery",
            "content delivery",
            "fast globally",
            "static acceleration",
        ],
        ComponentType.cache: [
            "cache",
            "redis",
            "low latency",
            "session store",
        ],
        ComponentType.queue: [
            "queue",
            "worker",
            "background jobs",
            "async",
            "event driven",
            "pubsub",
            "message",
        ],
        ComponentType.object_storage: [
            "upload",
            "file storage",
            "object storage",
            "blob",
            "documents",
            "media",
            "asset storage",
        ],
        ComponentType.waf: [
            "waf",
            "web firewall",
            "bot protection",
            "edge security",
        ],
        ComponentType.secrets: [
            "secret",
            "secrets",
            "key vault",
            "credential store",
        ],
        ComponentType.private_network: [
            "private network",
            "private endpoint",
            "vpc",
            "vnet",
            "isolated",
        ],
    }

    PRIORITY_KEYWORDS = {
        "scalability": ["scalable", "autoscale", "high traffic", "high growth", "scale"],
        "security": ["secure", "security", "oauth", "auth", "private", "zero trust"],
        "compliance": ["compliance", "regulated", "audit", "hipaa", "pci", "gdpr", "soc 2"],
        "operability": ["monitoring", "observability", "logging", "trace", "alerts"],
        "latency": ["low latency", "fast", "global", "real-time"],
        "cost": ["cost", "cheap", "budget", "optimize spend"],
        "resilience": ["high availability", "dr", "disaster recovery", "fault tolerant", "uptime"],
        "governance": ["governance", "policy", "guardrails"],
    }

    def parse(self, request: ArchitectureRequest) -> ArchitectureIntent:
        if settings.intent_backend == "openai":
            try:
                return self._parse_with_openai(request)
            except Exception:
                pass

        return self._parse_heuristically(request)

    def _parse_heuristically(self, request: ArchitectureRequest) -> ArchitectureIntent:
        lowered = request.prompt.lower()
        preferences = self._normalize_preferences(request.preferences)
        components: list[ParsedComponent] = []

        for component_type, keywords in self.COMPONENT_KEYWORDS.items():
            if any(keyword in lowered for keyword in keywords):
                components.append(self._build_component(component_type, lowered))

        if not components:
            components.extend(
                [
                    ParsedComponent(
                        type=ComponentType.frontend,
                        label="Web frontend",
                        requirements=["browser-based UI"],
                    ),
                    ParsedComponent(
                        type=ComponentType.backend_api,
                        label="Application API",
                        requirements=["stateless compute"],
                    ),
                    ParsedComponent(
                        type=ComponentType.database,
                        label="Primary database",
                        requirements=["managed data store"],
                        database_kind=DatabaseKind.relational,
                    ),
                ],
            )

        component_types = {component.type for component in components}
        if self._looks_like_web_app(lowered):
            if ComponentType.frontend not in component_types:
                components.insert(0, self._build_component(ComponentType.frontend, lowered))
            if ComponentType.backend_api not in component_types:
                components.append(self._build_component(ComponentType.backend_api, lowered))

        if ComponentType.backend_api in {component.type for component in components} and ComponentType.database not in {
            component.type for component in components
        }:
            components.append(self._build_component(ComponentType.database, lowered))

        components = self._add_derived_components(components, lowered, preferences)

        priorities = self._extract_priorities(lowered, preferences)
        patterns = self._extract_patterns(lowered, components, preferences)
        title = self._build_title(request.prompt, request.cloud, preferences)
        summary = self._build_summary(request.cloud, components, priorities, preferences)
        assumptions = self._build_assumptions(lowered, components, request.cloud, preferences)

        return ArchitectureIntent(
            title=title,
            summary=summary,
            cloud=request.cloud,
            preferences=preferences,
            priorities=priorities,
            patterns=patterns,
            assumptions=assumptions,
            components=components,
        )

    def _parse_with_openai(self, request: ArchitectureRequest) -> ArchitectureIntent:
        if not settings.openai_api_key:
            raise RuntimeError("OPENAI_API_KEY is not configured.")

        try:
            from openai import OpenAI
        except ImportError as exc:
            raise RuntimeError("openai package is not installed.") from exc

        preferences = self._normalize_preferences(request.preferences)
        client = OpenAI(api_key=settings.openai_api_key)
        response = client.chat.completions.create(
            model=settings.openai_model,
            temperature=0.2,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": INTENT_SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": (
                        f"Cloud: {request.cloud.value}\n"
                        f"Enterprise preferences: {json.dumps(preferences.model_dump(mode='json'))}\n"
                        f"Idea:\n{request.prompt}"
                    ),
                },
            ],
        )

        content = response.choices[0].message.content or "{}"
        payload = json.loads(content)

        raw_components = payload.get("components", [])
        components = [self._component_from_payload(item) for item in raw_components]
        components = self._add_derived_components(components, request.prompt.lower(), preferences)

        return ArchitectureIntent(
            title=payload.get("title") or self._build_title(request.prompt, request.cloud, preferences),
            summary=payload.get("summary")
            or self._build_summary(request.cloud, components, [], preferences),
            cloud=request.cloud,
            preferences=preferences,
            priorities=self._normalize_strings(payload.get("priorities"))
            or self._extract_priorities(request.prompt.lower(), preferences),
            patterns=self._normalize_strings(payload.get("patterns"))
            or self._extract_patterns(request.prompt.lower(), components, preferences),
            assumptions=self._normalize_strings(payload.get("assumptions"))
            or self._build_assumptions(request.prompt.lower(), components, request.cloud, preferences),
            components=components,
        )

    def _normalize_preferences(self, preferences: ArchitecturePreferences) -> ArchitecturePreferences:
        environments: list[str] = []
        for environment in preferences.environments:
            normalized = str(environment).strip().lower()
            if normalized and normalized not in environments:
                environments.append(normalized)

        if not environments:
            environments = ["dev", "staging", "prod"]

        return preferences.model_copy(update={"environments": environments})

    def _component_from_payload(self, payload: dict) -> ParsedComponent:
        component_type = ComponentType(payload["type"])
        database_kind = payload.get("database_kind")

        return ParsedComponent(
            type=component_type,
            label=payload.get("label") or component_type.value.replace("_", " ").title(),
            requirements=self._normalize_strings(payload.get("requirements")),
            database_kind=DatabaseKind(database_kind) if database_kind else None,
        )

    def _normalize_strings(self, value: object) -> list[str]:
        if not isinstance(value, list):
            return []
        return [str(item).strip() for item in value if str(item).strip()]

    def _build_component(self, component_type: ComponentType, lowered_prompt: str) -> ParsedComponent:
        if component_type == ComponentType.frontend:
            return ParsedComponent(
                type=component_type,
                label="Web frontend",
                requirements=["browser-based UI", "static asset delivery"],
            )

        if component_type == ComponentType.backend_api:
            requirements = ["stateless compute"]
            if any(keyword in lowered_prompt for keyword in ["scale", "autoscale", "high traffic"]):
                requirements.append("autoscaling")
            return ParsedComponent(
                type=component_type,
                label="Application API",
                requirements=requirements,
            )

        if component_type == ComponentType.database:
            database_kind = DatabaseKind.document if any(
                keyword in lowered_prompt
                for keyword in ["document", "nosql", "catalog", "flexible schema"]
            ) else DatabaseKind.relational
            return ParsedComponent(
                type=component_type,
                label="Primary database",
                requirements=["managed persistence"],
                database_kind=database_kind,
            )

        labels = {
            ComponentType.authentication: "Authentication",
            ComponentType.cdn: "Global edge layer",
            ComponentType.cache: "Cache layer",
            ComponentType.queue: "Async messaging",
            ComponentType.object_storage: "Object storage",
            ComponentType.api_gateway: "API gateway",
            ComponentType.monitoring: "Monitoring",
            ComponentType.waf: "Web application firewall",
            ComponentType.secrets: "Secrets management",
            ComponentType.private_network: "Private network boundary",
        }

        requirements_map = {
            ComponentType.authentication: ["oauth", "user identity"],
            ComponentType.cdn: ["global caching"],
            ComponentType.cache: ["hot-path acceleration"],
            ComponentType.queue: ["asynchronous processing"],
            ComponentType.object_storage: ["durable file storage"],
            ComponentType.api_gateway: ["routing", "policy enforcement"],
            ComponentType.monitoring: ["logs", "metrics", "traces"],
            ComponentType.waf: ["edge threat filtering", "bot protection"],
            ComponentType.secrets: ["secret storage", "credential rotation"],
            ComponentType.private_network: ["east-west isolation", "private service access"],
        }

        return ParsedComponent(
            type=component_type,
            label=labels[component_type],
            requirements=requirements_map[component_type],
        )

    def _looks_like_web_app(self, lowered_prompt: str) -> bool:
        return any(
            keyword in lowered_prompt
            for keyword in ["web app", "web application", "saas", "frontend", "browser", "portal", "dashboard"]
        )

    def _ensure_component(
        self,
        components: list[ParsedComponent],
        component_type: ComponentType,
        lowered_prompt: str,
    ) -> None:
        if any(component.type == component_type for component in components):
            return
        components.append(self._build_component(component_type, lowered_prompt))

    def _add_derived_components(
        self,
        components: list[ParsedComponent],
        lowered_prompt: str,
        preferences: ArchitecturePreferences,
    ) -> list[ParsedComponent]:
        existing = {component.type for component in components}

        if ComponentType.backend_api in existing:
            self._ensure_component(components, ComponentType.api_gateway, lowered_prompt)

        if ComponentType.monitoring not in existing:
            self._ensure_component(components, ComponentType.monitoring, lowered_prompt)

        if ComponentType.frontend in existing and (
            preferences.multi_region
            or preferences.user_scale == UserScale.internet_scale
            or any(keyword in lowered_prompt for keyword in ["global", "cdn", "edge"])
        ):
            self._ensure_component(components, ComponentType.cdn, lowered_prompt)

        if ComponentType.backend_api in {component.type for component in components}:
            self._ensure_component(components, ComponentType.secrets, lowered_prompt)

        if (
            preferences.network_exposure != NetworkExposure.public
            or preferences.data_sensitivity != DataSensitivity.internal
            or preferences.compliance_frameworks
        ):
            self._ensure_component(components, ComponentType.private_network, lowered_prompt)

        if preferences.network_exposure in {NetworkExposure.public, NetworkExposure.hybrid} and any(
            component.type in {ComponentType.frontend, ComponentType.api_gateway, ComponentType.backend_api}
            for component in components
        ):
            self._ensure_component(components, ComponentType.waf, lowered_prompt)

        if preferences.user_scale == UserScale.internet_scale and ComponentType.backend_api in {
            component.type for component in components
        }:
            self._ensure_component(components, ComponentType.cache, lowered_prompt)
            self._ensure_component(components, ComponentType.queue, lowered_prompt)

        ordered_types = [
            ComponentType.waf,
            ComponentType.cdn,
            ComponentType.frontend,
            ComponentType.authentication,
            ComponentType.api_gateway,
            ComponentType.backend_api,
            ComponentType.cache,
            ComponentType.queue,
            ComponentType.database,
            ComponentType.object_storage,
            ComponentType.secrets,
            ComponentType.private_network,
            ComponentType.monitoring,
        ]

        deduped: list[ParsedComponent] = []
        seen: set[ComponentType] = set()
        for component_type in ordered_types:
            for component in components:
                if component.type == component_type and component.type not in seen:
                    deduped.append(component)
                    seen.add(component.type)

        for component in components:
            if component.type not in seen:
                deduped.append(component)
                seen.add(component.type)

        return deduped

    def _extract_priorities(
        self,
        lowered_prompt: str,
        preferences: ArchitecturePreferences,
    ) -> list[str]:
        priorities = [
            priority
            for priority, keywords in self.PRIORITY_KEYWORDS.items()
            if any(keyword in lowered_prompt for keyword in keywords)
        ]

        if preferences.user_scale == UserScale.internet_scale:
            priorities.append("scalability")
        if preferences.data_sensitivity != DataSensitivity.internal:
            priorities.append("security")
        if preferences.compliance_frameworks:
            priorities.extend(["compliance", "governance"])
        if preferences.availability_tier != AvailabilityTier.standard or preferences.disaster_recovery:
            priorities.append("resilience")
        if preferences.multi_region:
            priorities.extend(["latency", "resilience"])

        return self._dedupe(priorities) or ["security", "resilience", "operability"]

    def _extract_patterns(
        self,
        lowered_prompt: str,
        components: list[ParsedComponent],
        preferences: ArchitecturePreferences,
    ) -> list[str]:
        patterns: list[str] = []
        component_types = {component.type for component in components}

        if ComponentType.backend_api in component_types:
            patterns.append("stateless_api")
        if ComponentType.cdn in component_types:
            patterns.append("edge_caching")
        if ComponentType.queue in component_types or "async" in lowered_prompt:
            patterns.append("async_processing")
        if preferences.user_scale in {UserScale.business, UserScale.internet_scale}:
            patterns.append("autoscaling")
        if ComponentType.authentication in component_types:
            patterns.append("oauth_authentication")
        if ComponentType.cache in component_types:
            patterns.append("cache_aside")
        if ComponentType.private_network in component_types:
            patterns.append("private_connectivity")
        if ComponentType.secrets in component_types:
            patterns.append("secret_rotation")
        if ComponentType.waf in component_types:
            patterns.append("defense_in_depth")
        if preferences.multi_region:
            patterns.append("multi_region_failover")
        if len(preferences.environments) >= 3:
            patterns.append("environment_isolation")
        if "multi tenant" in lowered_prompt or "multi-tenant" in lowered_prompt:
            patterns.append("multi_tenant_saas")

        return self._dedupe(patterns)

    def _build_title(
        self,
        prompt: str,
        cloud: CloudProvider,
        preferences: ArchitecturePreferences,
    ) -> str:
        subject = preferences.workload_name
        if not subject:
            normalized = re.sub(r"\s+", " ", prompt).strip()
            subject = normalized if len(normalized) <= 56 else f"{normalized[:53].rstrip()}..."
        return f"{cloud.value.upper()} Enterprise Architecture for {subject}"

    def _build_summary(
        self,
        cloud: CloudProvider,
        components: list[ParsedComponent],
        priorities: list[str],
        preferences: ArchitecturePreferences,
    ) -> str:
        component_names = ", ".join(component.type.value.replace("_", " ") for component in components[:5])
        priorities_text = ", ".join(priorities[:3]) if priorities else "security and resilience"
        footprint = "multi-region" if preferences.multi_region else "single-region"
        return (
            f"An enterprise-oriented {cloud.value.upper()} design for a {footprint} "
            f"{preferences.tenancy.value.replace('_', ' ')} workload using {component_names}, "
            f"optimized for {priorities_text}."
        )

    def _build_assumptions(
        self,
        lowered_prompt: str,
        components: list[ParsedComponent],
        cloud: CloudProvider,
        preferences: ArchitecturePreferences,
    ) -> list[str]:
        assumptions = [
            f"Assuming {cloud.value.upper()} managed services are preferred over self-hosted infrastructure.",
            f"Assuming the platform is promoted through {', '.join(preferences.environments)} environments.",
            f"Assuming {preferences.network_exposure.value} access requirements and {preferences.data_sensitivity.value} data handling needs.",
        ]

        component_types = {component.type for component in components}

        if preferences.multi_region:
            assumptions.append("Assuming regional failover or low-latency geographic reach is required.")
        if preferences.compliance_frameworks:
            frameworks = ", ".join(self._format_framework(item) for item in preferences.compliance_frameworks)
            assumptions.append(f"Assuming architecture controls must align with {frameworks}.")
        if ComponentType.database in component_types and not any(
            component.database_kind == DatabaseKind.document
            for component in components
            if component.type == ComponentType.database
        ):
            assumptions.append("Assuming the workload benefits from transactional consistency in a managed relational database.")
        if ComponentType.authentication in component_types:
            assumptions.append("Assuming workforce or customer identity should stay outside of custom application code.")
        if "mobile" not in lowered_prompt and ComponentType.frontend in component_types:
            assumptions.append("Assuming the primary user experience is a browser-based application.")

        return assumptions

    def _format_framework(self, framework: ComplianceFramework) -> str:
        mapping = {
            ComplianceFramework.soc2: "SOC 2",
            ComplianceFramework.iso27001: "ISO 27001",
            ComplianceFramework.hipaa: "HIPAA",
            ComplianceFramework.pci_dss: "PCI DSS",
            ComplianceFramework.gdpr: "GDPR",
        }
        return mapping[framework]

    def _dedupe(self, values: list[str]) -> list[str]:
        deduped: list[str] = []
        for value in values:
            if value not in deduped:
                deduped.append(value)
        return deduped
