from __future__ import annotations

from app.models import (
    ArchitectureIntent,
    ArchitectureValidationFinding,
    ServiceMapping,
)
from app.services.pattern_library import pattern_library


class ArchitectureValidator:
    def validate(
        self,
        intent: ArchitectureIntent,
        services: list[ServiceMapping],
    ) -> tuple[float, str | None, list[ArchitectureValidationFinding]]:
        findings: list[ArchitectureValidationFinding] = []
        score = 0.62
        component_types = [service.type.value for service in services]

        matched_pattern = pattern_library.match(
            " ".join(
                [
                    intent.title,
                    intent.summary,
                    intent.domain.value,
                    intent.archetype.value,
                    *intent.priorities,
                    *intent.patterns,
                    *intent.assumptions,
                    *[component.label for component in intent.components],
                ]
            )
        )

        if matched_pattern:
            score += 0.08
            overlap = pattern_library.component_overlap_score(
                matched_pattern.expected_components,
                component_types,
            )
            score += min(0.18, overlap * 0.18)

            missing = [
                component
                for component in matched_pattern.expected_components
                if component not in set(component_types)
            ]
            for component in missing[:4]:
                findings.append(
                    ArchitectureValidationFinding(
                        severity="warning",
                        message=f"Expected component missing for the {matched_pattern.title} pattern: {component}.",
                        recommendation="Review whether this workload needs that capability explicitly represented.",
                    )
                )

        if intent.preferences.multi_region:
            if "cdn" in component_types:
                score += 0.04
            else:
                findings.append(
                    ArchitectureValidationFinding(
                        severity="warning",
                        message="Multi-region or global posture is requested, but no clear global ingress/edge component is present.",
                        recommendation="Add an edge routing or global delivery service such as CDN/front door.",
                    )
                )

        if intent.preferences.availability_tier == "mission_critical":
            has_queue = "queue" in component_types
            has_monitoring = "monitoring" in component_types
            if has_queue:
                score += 0.03
            else:
                findings.append(
                    ArchitectureValidationFinding(
                        severity="warning",
                        message="Mission-critical workloads often need asynchronous buffering or workflow decoupling, but no queue component is present.",
                        recommendation="Consider a managed messaging layer for resilience and workload smoothing.",
                    )
                )
            if has_monitoring:
                score += 0.03

        if intent.preferences.data_sensitivity in {"confidential", "regulated"}:
            if "secrets" in component_types:
                score += 0.03
            else:
                findings.append(
                    ArchitectureValidationFinding(
                        severity="error",
                        message="Sensitive workloads should include explicit secrets management, but no secrets component is present.",
                        recommendation="Add a managed secrets/key service to the architecture.",
                    )
                )

            if intent.preferences.network_exposure != "public" and "private_network" not in component_types:
                findings.append(
                    ArchitectureValidationFinding(
                        severity="error",
                        message="The workload requests private or hybrid exposure, but no private network boundary is represented.",
                        recommendation="Add a private networking layer or service boundary.",
                    )
                )
            elif "private_network" in component_types:
                score += 0.03

        if any(item in {"hipaa", "pci_dss", "soc2", "iso27001"} for item in [framework.value for framework in intent.preferences.compliance_frameworks]):
            if "monitoring" in component_types:
                score += 0.03
            else:
                findings.append(
                    ArchitectureValidationFinding(
                        severity="warning",
                        message="Compliance-oriented workloads benefit from explicit monitoring and audit telemetry, but no monitoring component is present.",
                        recommendation="Add centralized monitoring and logging.",
                    )
                )

        if "backend_api" in component_types and "database" not in component_types and intent.domain.value in {
            "web_saas",
            "enterprise_application",
            "fintech_platform",
        }:
            findings.append(
                ArchitectureValidationFinding(
                    severity="warning",
                    message="The design contains application compute but no primary persistence layer.",
                    recommendation="Add a database or explicitly justify stateless-only behavior.",
                )
            )

        score = max(0.15, min(0.98, round(score, 2)))
        matched_pattern_title = matched_pattern.title if matched_pattern else None
        return score, matched_pattern_title, findings


architecture_validator = ArchitectureValidator()
