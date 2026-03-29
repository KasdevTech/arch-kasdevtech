from __future__ import annotations

from app.models import (
    ArchitectureIntent,
    AvailabilityTier,
    ComplianceFramework,
    ExplanationSection,
    NetworkExposure,
    ServiceMapping,
    SolutionArchetype,
)


class ExplanationService:
    def build_sections(
        self,
        intent: ArchitectureIntent,
        services: list[ServiceMapping],
    ) -> tuple[
        list[ExplanationSection],
        list[str],
        list[str],
        list[str],
        list[str],
        list[str],
        list[str],
    ]:
        service_lookup = {service.type.value: service for service in services}

        overview = self._overview(intent, service_lookup)
        topology = self._topology(intent, service_lookup)
        security = self._security(intent, service_lookup)
        operations = self._operations(intent, service_lookup)

        topology_highlights = self._topology_highlights(intent, service_lookup)
        security_controls = self._security_controls(intent, service_lookup)
        resilience_notes = self._resilience_notes(intent, service_lookup)
        operational_controls = self._operational_controls(intent, service_lookup)
        risk_flags = self._risk_flags(intent, service_lookup)

        next_steps = self._next_steps(intent)

        return (
            [
                ExplanationSection(title="Executive Summary", body=overview),
                ExplanationSection(title="Platform Topology", body=topology),
                ExplanationSection(title="Security and Governance", body=security),
                ExplanationSection(title="Operations and Resilience", body=operations),
            ],
            next_steps,
            topology_highlights,
            security_controls,
            resilience_notes,
            operational_controls,
            risk_flags,
        )

    def _overview(self, intent: ArchitectureIntent, service_lookup: dict[str, ServiceMapping]) -> str:
        parts = [
            f"This design targets {intent.cloud.value.upper()} for a {intent.domain.value.replace('_', ' ')} workload using the {intent.archetype.value.replace('_', ' ')} archetype with {intent.preferences.tenancy.value.replace('_', ' ')} tenancy."
        ]

        if intent.preferences.multi_region:
            parts.append("The topology assumes multi-region reach or failover instead of a single-region deployment.")
        else:
            parts.append("The topology starts single-region but preserves clear extension points for future regional expansion.")

        parts.append(
            f"It is biased toward {', '.join(intent.priorities[:3])} while maintaining promoted environments across {', '.join(intent.preferences.environments)}."
        )

        frontend = service_lookup.get("frontend")
        backend = service_lookup.get("backend_api")
        database = service_lookup.get("database")
        if frontend and backend and database:
            parts.append(
                f"The core flow spans {frontend.cloud_service}, {backend.cloud_service}, and {database.cloud_service}."
            )
        elif backend:
            parts.append(f"The control and orchestration layer is anchored on {backend.cloud_service}.")

        return " ".join(parts)

    def _topology(self, intent: ArchitectureIntent, service_lookup: dict[str, ServiceMapping]) -> str:
        sentences = []

        waf = service_lookup.get("waf")
        cdn = service_lookup.get("cdn")
        api_gateway = service_lookup.get("api_gateway")
        backend = service_lookup.get("backend_api")
        database = service_lookup.get("database")
        private_network = service_lookup.get("private_network")

        if waf and cdn:
            sentences.append(f"Public ingress is fronted by {waf.cloud_service} and {cdn.cloud_service}.")
        elif cdn:
            sentences.append(f"Public web traffic is accelerated through {cdn.cloud_service}.")

        if api_gateway and backend:
            sentences.append(f"API traffic is governed by {api_gateway.cloud_service} before reaching {backend.cloud_service}.")
        elif backend:
            sentences.append(f"Application logic runs on {backend.cloud_service}.")

        if database:
            sentences.append(f"Persistent workload state is stored in {database.cloud_service}.")

        if private_network:
            sentences.append(
                f"A network boundary is represented through {private_network.cloud_service} so platform and data tiers can stay privately reachable."
            )
        if intent.archetype == SolutionArchetype.ai_security_and_compliance:
            discovery = service_lookup.get("discovery")
            policy = service_lookup.get("policy_engine")
            analytics = service_lookup.get("analytics")
            if discovery and policy:
                sentences.append(
                    f"Discovery and control evaluation are driven through {discovery.cloud_service} and {policy.cloud_service} before findings are surfaced to operators."
                )
            if analytics:
                sentences.append(f"{analytics.cloud_service} provides the reporting surface for findings, compliance trends, and tenant-facing evidence.")
        if intent.archetype == SolutionArchetype.ai_application_stack:
            model_gateway = service_lookup.get("ai_model_gateway")
            search = service_lookup.get("search")
            if model_gateway and search:
                sentences.append(f"AI workflows combine {model_gateway.cloud_service} for inference and {search.cloud_service} for retrieval-grounded responses.")

        return " ".join(sentences)

    def _security(self, intent: ArchitectureIntent, service_lookup: dict[str, ServiceMapping]) -> str:
        sentences = [
            "The design separates identity, secret storage, ingress protection, and runtime workloads instead of concentrating those concerns inside the application code."
        ]

        auth = service_lookup.get("authentication")
        secrets = service_lookup.get("secrets")
        waf = service_lookup.get("waf")
        private_network = service_lookup.get("private_network")

        if auth:
            sentences.append(f"Identity is delegated to {auth.cloud_service}.")
        if secrets:
            sentences.append(f"Secrets and connection credentials are centralized in {secrets.cloud_service}.")
        if waf:
            sentences.append(f"Internet-facing requests are filtered through {waf.cloud_service}.")
        if private_network:
            sentences.append(
                f"Sensitive backend traffic is expected to stay within {private_network.cloud_service} rather than traverse open public paths."
            )
        if intent.preferences.compliance_frameworks:
            frameworks = ", ".join(self._format_framework(item) for item in intent.preferences.compliance_frameworks)
            sentences.append(f"The posture should be aligned with {frameworks} control expectations.")
        if intent.archetype == SolutionArchetype.ai_security_and_compliance:
            sentences.append("The product should track evidence lineage, control drift, and potential data leakage paths across discovered AI and supporting cloud resources.")

        return " ".join(sentences)

    def _operations(self, intent: ArchitectureIntent, service_lookup: dict[str, ServiceMapping]) -> str:
        monitoring = service_lookup.get("monitoring")
        database = service_lookup.get("database")
        queue = service_lookup.get("queue")

        sentences = [
            f"The current design aims for {intent.preferences.availability_tier.value.replace('_', ' ')} service levels and uses patterns such as {', '.join(intent.patterns[:4]) or 'managed service defaults'}.",
            "Environment isolation and managed services reduce the operational burden while still supporting policy-driven releases.",
        ]

        if monitoring:
            sentences.append(
                f"{monitoring.cloud_service} is included as a first-class operational control for logs, metrics, dashboards, and alerting."
            )
        if database and intent.preferences.disaster_recovery:
            sentences.append(f"{database.cloud_service} should be configured with backup retention and tested recovery procedures.")
        if queue:
            sentences.append("Async messaging gives the platform a buffer for burst handling and safer downstream processing.")
        if intent.archetype == SolutionArchetype.ai_security_and_compliance:
            sentences.append("Scheduled scans, evidence storage, and policy refresh cycles should run as explicit operational workflows rather than one-off manual reviews.")

        return " ".join(sentences)

    def _topology_highlights(
        self,
        intent: ArchitectureIntent,
        service_lookup: dict[str, ServiceMapping],
    ) -> list[str]:
        highlights = [
            f"Environment path: {', '.join(intent.preferences.environments)}",
            f"Tenancy model: {intent.preferences.tenancy.value.replace('_', ' ')}",
            "Managed services are used for compute, data, identity, and monitoring to shorten the operational runway.",
        ]

        if intent.preferences.multi_region:
            highlights.append("The design assumes a multi-region footprint for reach, resilience, or failover.")
        if "private_network" in service_lookup:
            highlights.append("Backend and data services are placed behind a private network boundary.")
        if intent.archetype == SolutionArchetype.ai_security_and_compliance:
            highlights.append("The architecture includes dedicated discovery, policy evaluation, findings persistence, and analytics surfaces.")

        return highlights

    def _security_controls(
        self,
        intent: ArchitectureIntent,
        service_lookup: dict[str, ServiceMapping],
    ) -> list[str]:
        controls = [
            "Separate identity, ingress protection, application runtime, and data tiers.",
            "Keep credentials and connection strings in a managed secrets service rather than application config.",
        ]

        if "waf" in service_lookup:
            controls.append("Apply WAF policies, managed rule sets, and bot filtering at the edge.")
        if "private_network" in service_lookup:
            controls.append("Use private service access and segmented network boundaries for east-west traffic.")
        if intent.preferences.compliance_frameworks:
            frameworks = ", ".join(self._format_framework(item) for item in intent.preferences.compliance_frameworks)
            controls.append(f"Map security controls and evidence collection to {frameworks}.")
        if intent.archetype == SolutionArchetype.ai_security_and_compliance:
            controls.append("Track evidence for policy evaluations, resource posture, and data leakage indicators per tenant or subscription scope.")

        return controls

    def _resilience_notes(
        self,
        intent: ArchitectureIntent,
        service_lookup: dict[str, ServiceMapping],
    ) -> list[str]:
        notes = [
            f"Availability target is modeled as {intent.preferences.availability_tier.value.replace('_', ' ')}.",
        ]

        if intent.preferences.multi_region:
            notes.append("Plan for regional failover, traffic steering, and data replication validation.")
        elif intent.preferences.availability_tier == AvailabilityTier.mission_critical:
            notes.append("Mission-critical requirements may need active-passive or active-active regional failover beyond the current single-region baseline.")

        if intent.preferences.disaster_recovery:
            notes.append("Backups, restore drills, and documented RPO/RTO targets should be part of the production rollout.")
        if "queue" in service_lookup:
            notes.append("Async processing reduces blast radius during downstream slowdowns or burst traffic.")
        if "cache" in service_lookup:
            notes.append("Caching can reduce latency and preserve database headroom during traffic spikes.")

        return notes

    def _operational_controls(
        self,
        intent: ArchitectureIntent,
        service_lookup: dict[str, ServiceMapping],
    ) -> list[str]:
        controls = [
            "Use infrastructure as code and environment promotion instead of manually assembled environments.",
            "Attach dashboards, alerts, and log retention policies to the initial deployment, not a later phase.",
            "Define CI/CD gates for tests, security scanning, and approval workflows.",
        ]

        if "monitoring" in service_lookup:
            controls.append("Central monitoring should publish latency, saturation, error, and dependency health signals.")
        if len(intent.preferences.environments) < 3:
            controls.append("Add at least a staging environment before production rollout for safer release validation.")
        if intent.archetype == SolutionArchetype.ai_security_and_compliance:
            controls.append("Schedule recurring scans, baseline drift detection, and tenant-scoped evidence retention workflows.")

        return controls

    def _risk_flags(
        self,
        intent: ArchitectureIntent,
        service_lookup: dict[str, ServiceMapping],
    ) -> list[str]:
        risks: list[str] = []

        if intent.preferences.availability_tier == AvailabilityTier.mission_critical and not intent.preferences.multi_region:
            risks.append("Mission-critical availability goals may not be met without multi-region failover and tested recovery.")
        if intent.preferences.network_exposure == NetworkExposure.public and "waf" not in service_lookup:
            risks.append("Public exposure without a WAF layer increases edge risk.")
        if intent.preferences.compliance_frameworks and len(intent.preferences.environments) < 3:
            risks.append("Compliance-heavy workloads usually need stronger environment separation and release evidence.")
        if "secrets" not in service_lookup:
            risks.append("Secret rotation and credential isolation are underspecified for the current architecture.")
        if intent.archetype == SolutionArchetype.ai_security_and_compliance and "policy_engine" not in service_lookup:
            risks.append("A governance-focused product without a dedicated policy evaluation layer may collapse into generic monitoring instead of real compliance assessment.")

        return risks or ["No critical design blockers detected at this abstraction level; validate the details with workload-specific requirements."]

    def _next_steps(self, intent: ArchitectureIntent) -> list[str]:
        baseline = [
            "Validate non-functional requirements with concrete SLOs, RPO/RTO targets, and a real traffic profile.",
            "Translate the starter Terraform into reusable modules with environment promotion, policy checks, and secrets integration.",
            "Define release governance with CI/CD approvals, security scanning, and operational runbooks before production rollout.",
        ]
        if intent.archetype == SolutionArchetype.ai_security_and_compliance:
            return [
                "Define the exact inventory and scan scope across AI resources, supporting data stores, identities, and network paths.",
                "Map findings to a control framework and evidence model so posture, leakage, and compliance results are explainable to customers.",
                "Design tenant onboarding, cross-subscription access, and safe remediation workflows before production rollout.",
            ]
        if intent.archetype == SolutionArchetype.ai_application_stack:
            return [
                "Validate prompt flow, model routing, grounding data quality, and safety controls with real application scenarios.",
                "Define evaluation loops for latency, retrieval quality, and response safety before production rollout.",
                "Translate the starter Terraform into reusable modules with secrets, observability, and deployment guardrails.",
            ]
        return baseline

    def _format_framework(self, framework: ComplianceFramework) -> str:
        mapping = {
            ComplianceFramework.soc2: "SOC 2",
            ComplianceFramework.iso27001: "ISO 27001",
            ComplianceFramework.hipaa: "HIPAA",
            ComplianceFramework.pci_dss: "PCI DSS",
            ComplianceFramework.gdpr: "GDPR",
        }
        return mapping[framework]
