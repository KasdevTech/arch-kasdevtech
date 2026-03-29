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
    SolutionArchetype,
    SolutionDomain,
    UserScale,
)
from app.services.prompt_templates import INTENT_SYSTEM_PROMPT


class IntentParser:
    DOMAIN_PRIORITY = {
        SolutionDomain.ai_governance: 110,
        SolutionDomain.cybersecurity: 105,
        SolutionDomain.fintech_platform: 100,
        SolutionDomain.developer_platform: 95,
        SolutionDomain.ai_platform: 90,
        SolutionDomain.integration_platform: 80,
        SolutionDomain.data_platform: 70,
        SolutionDomain.analytics_platform: 65,
        SolutionDomain.web_saas: 50,
        SolutionDomain.enterprise_application: 10,
    }

    DOMAIN_OVERRIDE_RULES = [
        (
            SolutionDomain.fintech_platform,
            [
                "payment gateway",
                "payment processor",
                "pci",
                "fraud",
                "transaction processing",
                "wallet",
                "banking",
                "ledger",
                "fintech",
            ],
        ),
        (
            SolutionDomain.developer_platform,
            [
                "developer portal",
                "internal developer platform",
                "platform engineering",
                "service catalog",
                "golden path",
                "self-service provisioning",
                "idp",
            ],
        ),
        (
            SolutionDomain.ai_governance,
            [
                "data leakage",
                "data loss",
                "compliance violation",
                "compliance violations",
                "security posture",
                "ai component",
                "ai components",
                "azure ai",
                "azure openai",
                "responsible ai",
                "resource graph",
                "purview",
                "governance",
                "policy",
                "discovers",
                "discovers",
                "inventory",
            ],
        ),
        (
            SolutionDomain.cybersecurity,
            [
                "vulnerability",
                "vulnerabilities",
                "threat detection",
                "security finding",
                "security findings",
                "incident response",
                "siem",
                "soc",
                "exposure",
            ],
        ),
        (
            SolutionDomain.ai_platform,
            [
                "rag",
                "copilot",
                "chatbot",
                "assistant",
                "model inference",
                "prompt",
                "vector search",
                "embeddings",
            ],
        ),
        (
            SolutionDomain.data_platform,
            [
                "data lake",
                "warehouse",
                "etl",
                "elt",
                "streaming",
                "pipeline",
                "batch processing",
            ],
        ),
        (
            SolutionDomain.web_saas,
            [
                "e-commerce",
                "ecommerce",
                "online store",
                "shopping cart",
                "checkout",
                "payments",
                "payment",
                "catalog",
                "orders",
                "1m users",
                "million users",
                "global traffic",
            ],
        ),
    ]

    DOMAIN_KEYWORDS = {
        SolutionDomain.ai_governance: [
            "compliance",
            "data leakage",
            "data loss",
            "guardrails",
            "governance",
            "azure ai",
            "azure openai",
            "ai component",
            "ai inventory",
            "policy",
            "purview",
            "defender",
            "sentinel",
            "responsible ai",
        ],
        SolutionDomain.cybersecurity: [
            "soc",
            "siem",
            "security operations",
            "threat detection",
            "vulnerability",
            "exposure",
            "security posture",
            "attack",
            "threat intel",
            "incident",
        ],
        SolutionDomain.fintech_platform: [
            "payment",
            "payments",
            "pci",
            "fraud",
            "transaction",
            "fintech",
            "checkout",
            "ledger",
            "wallet",
        ],
        SolutionDomain.data_platform: [
            "etl",
            "elt",
            "data lake",
            "warehouse",
            "pipeline",
            "streaming",
            "batch",
            "analytics pipeline",
            "data ingestion",
        ],
        SolutionDomain.ai_platform: [
            "rag",
            "llm",
            "genai",
            "chatbot",
            "assistant",
            "model inference",
            "embeddings",
            "vector",
            "prompt",
            "machine learning",
            "ml",
        ],
        SolutionDomain.integration_platform: [
            "integration",
            "workflow",
            "connector",
            "orchestration",
            "b2b",
            "api integration",
            "edi",
            "sync between",
        ],
        SolutionDomain.developer_platform: [
            "developer portal",
            "internal platform",
            "platform engineering",
            "service catalog",
            "golden path",
            "self-service",
            "idp",
        ],
        SolutionDomain.analytics_platform: [
            "dashboard",
            "reporting",
            "business intelligence",
            "metrics",
            "kpi",
            "analytics",
        ],
        SolutionDomain.web_saas: [
            "saas",
            "web app",
            "customer portal",
            "frontend",
            "browser",
            "multi-tenant",
            "e-commerce",
            "ecommerce",
            "checkout",
            "orders",
            "payments",
        ],
    }

    ARCHETYPE_BY_DOMAIN = {
        SolutionDomain.web_saas: SolutionArchetype.transactional_saas,
        SolutionDomain.data_platform: SolutionArchetype.data_processing_platform,
        SolutionDomain.ai_platform: SolutionArchetype.ai_application_stack,
        SolutionDomain.ai_governance: SolutionArchetype.ai_security_and_compliance,
        SolutionDomain.cybersecurity: SolutionArchetype.security_operations_center,
        SolutionDomain.fintech_platform: SolutionArchetype.fintech_transaction_platform,
        SolutionDomain.integration_platform: SolutionArchetype.integration_hub,
        SolutionDomain.developer_platform: SolutionArchetype.internal_developer_portal,
        SolutionDomain.analytics_platform: SolutionArchetype.analytics_and_reporting,
        SolutionDomain.enterprise_application: SolutionArchetype.enterprise_system_of_record,
    }

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
        ComponentType.cicd_pipeline: [
            "ci/cd",
            "cicd",
            "pipeline",
            "deployment pipeline",
            "github actions",
            "azure devops",
            "build pipeline",
            "release pipeline",
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
        ComponentType.analytics: [
            "analytics",
            "dashboard",
            "reporting",
            "business intelligence",
            "findings",
            "evidence",
        ],
        ComponentType.policy_engine: [
            "policy",
            "governance",
            "guardrails",
            "compliance engine",
            "rule engine",
        ],
        ComponentType.security_analytics: [
            "siem",
            "soc",
            "security analytics",
            "incident",
            "threat detection",
        ],
        ComponentType.discovery: [
            "discovery",
            "inventory",
            "resource graph",
            "scan resources",
            "enumerate",
        ],
        ComponentType.ai_model_gateway: [
            "llm",
            "model endpoint",
            "azure openai",
            "bedrock",
            "vertex ai",
            "inference",
            "model gateway",
        ],
        ComponentType.search: [
            "search",
            "vector",
            "semantic search",
            "retrieval",
            "index",
        ],
        ComponentType.ml_platform: [
            "machine learning",
            "ml",
            "training",
            "feature store",
            "mlops",
        ],
        ComponentType.integration: [
            "integration",
            "connector",
            "workflow",
            "orchestration",
            "b2b",
            "webhook",
            "payment gateway",
            "payments integration",
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
        if settings.intent_backend == "llm_service":
            try:
                return self._parse_with_llm_service(request)
            except Exception:
                pass

        if settings.intent_backend == "openai":
            try:
                return self._parse_with_openai(request)
            except Exception:
                pass

        return self._parse_heuristically(request)

    def _parse_heuristically(self, request: ArchitectureRequest) -> ArchitectureIntent:
        lowered = request.prompt.lower()
        preferences = self._normalize_preferences(request.preferences)
        domain_hint = self._forced_domain(lowered)
        components: list[ParsedComponent] = []

        if any(
            phrase in lowered
            for phrase in ["three tier", "3 tier", "three-tier", "three tier app", "sample 3 tier"]
        ):
            components.extend(
                [
                    self._build_component(ComponentType.frontend, lowered),
                    self._build_component(ComponentType.backend_api, lowered),
                    self._build_component(ComponentType.database, lowered),
                ]
            )

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
        if self._looks_like_web_app(lowered) and domain_hint in {
            None,
            SolutionDomain.web_saas,
            SolutionDomain.enterprise_application,
        }:
            if ComponentType.frontend not in component_types:
                components.insert(0, self._build_component(ComponentType.frontend, lowered))
            if ComponentType.backend_api not in component_types:
                components.append(self._build_component(ComponentType.backend_api, lowered))

        if (
            ComponentType.backend_api in {component.type for component in components}
            and ComponentType.database not in {component.type for component in components}
            and domain_hint not in {SolutionDomain.ai_governance, SolutionDomain.cybersecurity}
        ):
            components.append(self._build_component(ComponentType.database, lowered))

        components = self._add_derived_components(components, lowered, preferences)

        priorities = self._extract_priorities(lowered, preferences)
        patterns = self._extract_patterns(lowered, components, preferences)
        domain = domain_hint or self._classify_domain(lowered, components)
        archetype = self._select_archetype(domain, lowered, components)
        title = self._build_title(request.prompt, request.cloud, preferences)
        summary = self._build_summary(request.cloud, components, priorities, preferences, domain, archetype)
        assumptions = self._build_assumptions(lowered, components, request.cloud, preferences, domain)

        return ArchitectureIntent(
            title=title,
            summary=summary,
            cloud=request.cloud,
            domain=domain,
            archetype=archetype,
            preferences=preferences,
            priorities=priorities,
            patterns=patterns,
            assumptions=assumptions,
            components=components,
        )

    def _parse_with_openai(self, request: ArchitectureRequest) -> ArchitectureIntent:
        if not settings.openai_api_key:
            raise RuntimeError("OPENAI_API_KEY is not configured.")

        return self._parse_with_chat_completion(
            request=request,
            api_key=settings.openai_api_key,
            model=settings.openai_model,
        )

    def _parse_with_llm_service(self, request: ArchitectureRequest) -> ArchitectureIntent:
        if not settings.llm_service_base_url:
            raise RuntimeError("AI_ARCHITECT_LLM_BASE_URL is not configured.")

        return self._parse_with_chat_completion(
            request=request,
            api_key=settings.llm_service_api_key or "local-service",
            model=settings.llm_service_model or "local-model",
            base_url=settings.llm_service_base_url,
        )

    def _parse_with_chat_completion(
        self,
        request: ArchitectureRequest,
        api_key: str,
        model: str,
        base_url: str | None = None,
    ) -> ArchitectureIntent:
        if not api_key:
            raise RuntimeError("API key is not configured.")

        try:
            from openai import OpenAI
        except ImportError as exc:
            raise RuntimeError("openai package is not installed.") from exc

        preferences = self._normalize_preferences(request.preferences)
        client = OpenAI(
            api_key=api_key,
            base_url=base_url,
        )
        response = client.chat.completions.create(
            model=model,
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
        return self._intent_from_payload(payload, request, preferences)

    def _intent_from_payload(
        self,
        payload: dict,
        request: ArchitectureRequest,
        preferences: ArchitecturePreferences,
    ) -> ArchitectureIntent:
        lowered_prompt = request.prompt.lower()

        raw_components = payload.get("components", [])
        components = [
            component
            for item in raw_components
            if isinstance(item, dict)
            for component in [self._safe_component_from_payload(item)]
            if component is not None
        ]

        forced_domain = self._forced_domain(lowered_prompt)
        if not components:
            fallback_intent = self._parse_heuristically(request)
            components = fallback_intent.components

        components = self._add_derived_components(components, lowered_prompt, preferences)
        domain = forced_domain or self._safe_domain(payload.get("domain")) or self._classify_domain(lowered_prompt, components)
        archetype = self._safe_archetype(payload.get("archetype")) or self._select_archetype(
            domain,
            lowered_prompt,
            components,
        )

        return ArchitectureIntent(
            title=payload.get("title") or self._build_title(request.prompt, request.cloud, preferences),
            summary=payload.get("summary")
            or self._build_summary(
                request.cloud,
                components,
                [],
                preferences,
                domain=domain,
                archetype=archetype,
            ),
            cloud=request.cloud,
            domain=domain,
            archetype=archetype,
            preferences=preferences,
            priorities=self._normalize_strings(payload.get("priorities"))
            or self._extract_priorities(lowered_prompt, preferences),
            patterns=self._normalize_strings(payload.get("patterns"))
            or self._extract_patterns(lowered_prompt, components, preferences),
            assumptions=self._normalize_strings(payload.get("assumptions"))
            or self._build_assumptions(
                lowered_prompt,
                components,
                request.cloud,
                preferences,
                domain,
            ),
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

    def _safe_component_from_payload(self, payload: dict) -> ParsedComponent | None:
        try:
            return self._component_from_payload(payload)
        except Exception:
            return None

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
            ComponentType.cicd_pipeline: "CI/CD pipeline",
            ComponentType.object_storage: "Object storage",
            ComponentType.api_gateway: "API gateway",
            ComponentType.monitoring: "Monitoring",
            ComponentType.waf: "Web application firewall",
            ComponentType.secrets: "Secrets management",
            ComponentType.private_network: "Private network boundary",
            ComponentType.analytics: "Analytics workspace",
            ComponentType.policy_engine: "Policy engine",
            ComponentType.security_analytics: "Security analytics",
            ComponentType.discovery: "Discovery engine",
            ComponentType.ai_model_gateway: "Model gateway",
            ComponentType.search: "Search index",
            ComponentType.ml_platform: "ML platform",
            ComponentType.integration: "Integration fabric",
        }

        requirements_map = {
            ComponentType.authentication: ["oauth", "user identity"],
            ComponentType.cdn: ["global caching"],
            ComponentType.cache: ["hot-path acceleration"],
            ComponentType.queue: ["asynchronous processing"],
            ComponentType.cicd_pipeline: ["build automation", "release orchestration"],
            ComponentType.object_storage: ["durable file storage"],
            ComponentType.api_gateway: ["routing", "policy enforcement"],
            ComponentType.monitoring: ["logs", "metrics", "traces"],
            ComponentType.waf: ["edge threat filtering", "bot protection"],
            ComponentType.secrets: ["secret storage", "credential rotation"],
            ComponentType.private_network: ["east-west isolation", "private service access"],
            ComponentType.analytics: ["dashboards", "evidence insights"],
            ComponentType.policy_engine: ["rules evaluation", "compliance checks"],
            ComponentType.security_analytics: ["detections", "incident context"],
            ComponentType.discovery: ["asset discovery", "resource inventory"],
            ComponentType.ai_model_gateway: ["model invocation", "safety controls"],
            ComponentType.search: ["indexing", "retrieval"],
            ComponentType.ml_platform: ["training", "model lifecycle"],
            ComponentType.integration: ["connector orchestration", "event flows"],
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

        if any(keyword in lowered_prompt for keyword in ["analytics", "reporting", "insight", "findings"]):
            self._ensure_component(components, ComponentType.analytics, lowered_prompt)

        if ComponentType.frontend in existing and (
            preferences.multi_region
            or preferences.user_scale == UserScale.internet_scale
            or any(keyword in lowered_prompt for keyword in ["global", "cdn", "edge"])
        ):
            self._ensure_component(components, ComponentType.cdn, lowered_prompt)

        if ComponentType.backend_api in {component.type for component in components}:
            self._ensure_component(components, ComponentType.secrets, lowered_prompt)

        domain = self._forced_domain(lowered_prompt) or self._classify_domain(lowered_prompt, components)
        if domain in {SolutionDomain.ai_governance, SolutionDomain.cybersecurity}:
            self._ensure_component(components, ComponentType.discovery, lowered_prompt)
            self._ensure_component(components, ComponentType.policy_engine, lowered_prompt)
            self._ensure_component(components, ComponentType.security_analytics, lowered_prompt)
            self._ensure_component(components, ComponentType.object_storage, lowered_prompt)
            self._ensure_component(components, ComponentType.analytics, lowered_prompt)
            if ComponentType.backend_api not in {component.type for component in components}:
                self._ensure_component(components, ComponentType.backend_api, lowered_prompt)

        if domain == SolutionDomain.ai_platform:
            self._ensure_component(components, ComponentType.ai_model_gateway, lowered_prompt)
            self._ensure_component(components, ComponentType.search, lowered_prompt)
            if any(keyword in lowered_prompt for keyword in ["training", "fine tune", "machine learning", "ml"]):
                self._ensure_component(components, ComponentType.ml_platform, lowered_prompt)

        if domain == SolutionDomain.integration_platform:
            self._ensure_component(components, ComponentType.integration, lowered_prompt)
            self._ensure_component(components, ComponentType.queue, lowered_prompt)

        if domain in {SolutionDomain.data_platform, SolutionDomain.analytics_platform}:
            self._ensure_component(components, ComponentType.integration, lowered_prompt)
            self._ensure_component(components, ComponentType.object_storage, lowered_prompt)
            self._ensure_component(components, ComponentType.analytics, lowered_prompt)

        if domain == SolutionDomain.web_saas:
            if any(keyword in lowered_prompt for keyword in ["global traffic", "global", "cdn", "worldwide"]):
                self._ensure_component(components, ComponentType.cdn, lowered_prompt)
            if any(
                keyword in lowered_prompt
                for keyword in [
                    "1m users",
                    "million users",
                    "high scale",
                    "high traffic",
                    "scalable",
                    "low latency",
                    "e-commerce",
                    "ecommerce",
                ]
            ):
                self._ensure_component(components, ComponentType.cache, lowered_prompt)
                self._ensure_component(components, ComponentType.queue, lowered_prompt)
            if any(keyword in lowered_prompt for keyword in ["payment", "payments", "checkout", "order"]):
                self._ensure_component(components, ComponentType.integration, lowered_prompt)
            if any(keyword in lowered_prompt for keyword in ["microservice", "microservices"]):
                self._ensure_component(components, ComponentType.backend_api, lowered_prompt)
            if any(keyword in lowered_prompt for keyword in ["ci/cd", "cicd", "pipeline", "deployment pipeline"]):
                self._ensure_component(components, ComponentType.cicd_pipeline, lowered_prompt)

        if domain == SolutionDomain.fintech_platform:
            self._ensure_component(components, ComponentType.backend_api, lowered_prompt)
            self._ensure_component(components, ComponentType.api_gateway, lowered_prompt)
            self._ensure_component(components, ComponentType.queue, lowered_prompt)
            self._ensure_component(components, ComponentType.cache, lowered_prompt)
            self._ensure_component(components, ComponentType.integration, lowered_prompt)
            self._ensure_component(components, ComponentType.secrets, lowered_prompt)
            self._ensure_component(components, ComponentType.private_network, lowered_prompt)
            if any(keyword in lowered_prompt for keyword in ["ci/cd", "cicd", "pipeline", "deployment pipeline"]):
                self._ensure_component(components, ComponentType.cicd_pipeline, lowered_prompt)
            if any(keyword in lowered_prompt for keyword in ["global", "multi-region", "worldwide"]):
                self._ensure_component(components, ComponentType.cdn, lowered_prompt)

        if domain == SolutionDomain.developer_platform:
            self._ensure_component(components, ComponentType.frontend, lowered_prompt)
            self._ensure_component(components, ComponentType.authentication, lowered_prompt)
            self._ensure_component(components, ComponentType.backend_api, lowered_prompt)
            self._ensure_component(components, ComponentType.database, lowered_prompt)
            self._ensure_component(components, ComponentType.integration, lowered_prompt)
            self._ensure_component(components, ComponentType.policy_engine, lowered_prompt)
            self._ensure_component(components, ComponentType.cicd_pipeline, lowered_prompt)

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
            ComponentType.cicd_pipeline,
            ComponentType.cache,
            ComponentType.queue,
            ComponentType.database,
            ComponentType.object_storage,
            ComponentType.discovery,
            ComponentType.policy_engine,
            ComponentType.ai_model_gateway,
            ComponentType.search,
            ComponentType.integration,
            ComponentType.ml_platform,
            ComponentType.analytics,
            ComponentType.security_analytics,
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
        if any(keyword in lowered_prompt for keyword in ["microservice", "microservices"]):
            patterns.append("microservices")
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
        if any(keyword in lowered_prompt for keyword in ["payment", "payments", "checkout"]):
            patterns.append("isolated_payment_flows")
        if any(keyword in lowered_prompt for keyword in ["global traffic", "global", "multi-region"]):
            patterns.append("global_traffic_routing")
        if any(keyword in lowered_prompt for keyword in ["ci/cd", "cicd", "pipeline", "deployment pipeline"]):
            patterns.append("continuous_delivery")
        if any(keyword in lowered_prompt for keyword in ["fraud", "pci", "ledger", "banking"]):
            patterns.append("regulated_transaction_flows")

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
        domain: SolutionDomain,
        archetype: SolutionArchetype,
    ) -> str:
        component_names = ", ".join(component.type.value.replace("_", " ") for component in components[:5])
        priorities_text = ", ".join(priorities[:3]) if priorities else "security and resilience"
        footprint = "multi-region" if preferences.multi_region else "single-region"
        return (
            f"An enterprise-oriented {cloud.value.upper()} {domain.value.replace('_', ' ')} design "
            f"using the {archetype.value.replace('_', ' ')} pattern for a {footprint} "
            f"{preferences.tenancy.value.replace('_', ' ')} workload using {component_names}, "
            f"optimized for {priorities_text}."
        )

    def _build_assumptions(
        self,
        lowered_prompt: str,
        components: list[ParsedComponent],
        cloud: CloudProvider,
        preferences: ArchitecturePreferences,
        domain: SolutionDomain,
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
        if domain == SolutionDomain.ai_governance:
            assumptions.append("Assuming the product must continuously discover AI resources, evaluate controls, and surface compliance or leakage findings.")
        if domain == SolutionDomain.cybersecurity:
            assumptions.append("Assuming the system must aggregate telemetry and convert signals into detections, findings, or remediation guidance.")
        if domain == SolutionDomain.ai_platform:
            assumptions.append("Assuming model access, retrieval, and application safety controls are first-class parts of the architecture.")
        if domain == SolutionDomain.web_saas and any(
            keyword in lowered_prompt for keyword in ["e-commerce", "ecommerce", "payment", "checkout", "orders"]
        ):
            assumptions.append("Assuming transactional integrity, payment isolation, and burst-tolerant order processing are core platform requirements.")
        if domain == SolutionDomain.fintech_platform:
            assumptions.append("Assuming payment isolation, regulatory evidence, and transaction integrity are primary architectural concerns.")

        return assumptions

    def _classify_domain(
        self,
        lowered_prompt: str,
        components: list[ParsedComponent],
    ) -> SolutionDomain:
        forced = self._forced_domain(lowered_prompt)
        if forced is not None:
            return forced

        scores: dict[SolutionDomain, int] = {}
        for domain, keywords in self.DOMAIN_KEYWORDS.items():
            matched_keywords = sum(1 for keyword in keywords if keyword in lowered_prompt)
            if matched_keywords > 0:
                scores[domain] = matched_keywords * 100 + self.DOMAIN_PRIORITY.get(domain, 0)
            else:
                scores[domain] = 0

        component_types = {component.type for component in components}
        if ComponentType.ai_model_gateway in component_types or ComponentType.search in component_types:
            scores[SolutionDomain.ai_platform] = scores.get(SolutionDomain.ai_platform, 0) + 2
        if ComponentType.policy_engine in component_types or ComponentType.discovery in component_types:
            scores[SolutionDomain.ai_governance] = scores.get(SolutionDomain.ai_governance, 0) + 3
        if ComponentType.security_analytics in component_types:
            scores[SolutionDomain.cybersecurity] = scores.get(SolutionDomain.cybersecurity, 0) + 2
        if ComponentType.integration in component_types:
            scores[SolutionDomain.integration_platform] = scores.get(SolutionDomain.integration_platform, 0) + 2
        if ComponentType.analytics in component_types and "dashboard" in lowered_prompt:
            scores[SolutionDomain.analytics_platform] = scores.get(SolutionDomain.analytics_platform, 0) + 1

        best_domain = max(scores.items(), key=lambda item: item[1], default=(SolutionDomain.enterprise_application, 0))
        if best_domain[1] <= 0:
            if self._looks_like_web_app(lowered_prompt):
                return SolutionDomain.web_saas
            return SolutionDomain.enterprise_application
        return best_domain[0]

    def _forced_domain(self, lowered_prompt: str) -> SolutionDomain | None:
        matches: list[tuple[int, int, SolutionDomain]] = []
        for domain, keywords in self.DOMAIN_OVERRIDE_RULES:
            matched_keywords = sum(1 for keyword in keywords if keyword in lowered_prompt)
            if matched_keywords:
                matches.append(
                    (
                        matched_keywords,
                        self.DOMAIN_PRIORITY.get(domain, 0),
                        domain,
                    )
                )

        if not matches:
            return None

        matches.sort(reverse=True)
        return matches[0][2]

    def _select_archetype(
        self,
        domain: SolutionDomain,
        lowered_prompt: str,
        components: list[ParsedComponent],
    ) -> SolutionArchetype:
        if domain == SolutionDomain.web_saas and any(
            keyword in lowered_prompt for keyword in ["event", "async", "queue", "workflow"]
        ):
            return SolutionArchetype.event_driven_platform
        if domain == SolutionDomain.enterprise_application:
            if any(keyword in lowered_prompt for keyword in ["event", "queue", "async", "workflow"]):
                return SolutionArchetype.event_driven_platform
            return SolutionArchetype.enterprise_system_of_record
        return self.ARCHETYPE_BY_DOMAIN.get(domain, SolutionArchetype.enterprise_system_of_record)

    def _safe_domain(self, value: object) -> SolutionDomain | None:
        try:
            return SolutionDomain(str(value))
        except Exception:
            return None

    def _safe_archetype(self, value: object) -> SolutionArchetype | None:
        try:
            return SolutionArchetype(str(value))
        except Exception:
            return None

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
