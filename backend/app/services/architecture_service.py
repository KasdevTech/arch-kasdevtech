from __future__ import annotations

from uuid import uuid4

from app.models import (
    ArchitectureIntent,
    ArchitectureRequest,
    ArchitectureResponse,
    ArchitectureRebuildRequest,
    ParsedComponent,
)
from app.services.architecture_validator import architecture_validator
from app.services.diagram_service import MermaidDiagramService
from app.services.explanation_service import ExplanationService
from app.services.iac_service import TerraformStarterService
from app.services.intent_parser import IntentParser
from app.services.mapping_engine import CloudMappingEngine


class ArchitectureService:
    def __init__(self) -> None:
        self.intent_parser = IntentParser()
        self.mapping_engine = CloudMappingEngine()
        self.diagram_service = MermaidDiagramService()
        self.explanation_service = ExplanationService()
        self.iac_service = TerraformStarterService()

    def generate(self, payload: ArchitectureRequest) -> ArchitectureResponse:
        intent = self.intent_parser.parse(payload)
        services, connections = self.mapping_engine.map(intent)
        return self._build_response(
            intent=intent,
            services=services,
            connections=connections,
            request_id=str(uuid4()),
        )

    def rebuild(self, payload: ArchitectureRebuildRequest) -> ArchitectureResponse:
        architecture = payload.architecture
        normalized_services = self._normalize_services(architecture.services)
        intent = ArchitectureIntent(
            title=architecture.title,
            summary=architecture.summary,
            cloud=architecture.cloud,
            domain=architecture.domain,
            archetype=architecture.archetype,
            preferences=architecture.preferences,
            priorities=architecture.priorities,
            patterns=[],
            assumptions=architecture.assumptions,
            components=[
                ParsedComponent(type=service.type, label=service.label)
                for service in normalized_services
            ],
            classification_confidence=architecture.classification_confidence,
            retrieval_matches=architecture.retrieval_matches,
        )
        return self._build_response(
            intent=intent,
            services=normalized_services,
            connections=self.mapping_engine._build_connections(intent, normalized_services),
            request_id=architecture.request_id,
            created_at=architecture.created_at,
            include_iac=bool(architecture.iac_template),
        )

    def _build_response(
        self,
        *,
        intent: ArchitectureIntent,
        services,
        connections,
        request_id: str,
        created_at=None,
        include_iac: bool = True,
    ) -> ArchitectureResponse:
        mermaid = self.diagram_service.render(services, connections)
        (
            explanation_sections,
            next_steps,
            topology_highlights,
            security_controls,
            resilience_notes,
            operational_controls,
            risk_flags,
        ) = self.explanation_service.build_sections(intent, services)
        iac_template = self.iac_service.build(intent, services) if include_iac else None
        confidence_score, matched_pattern, validator_findings = architecture_validator.validate(
            intent,
            services,
        )

        response = ArchitectureResponse(
            request_id=request_id,
            title=intent.title,
            summary=intent.summary,
            cloud=intent.cloud,
            domain=intent.domain,
            archetype=intent.archetype,
            preferences=intent.preferences,
            priorities=intent.priorities,
            assumptions=intent.assumptions,
            topology_highlights=topology_highlights,
            security_controls=security_controls,
            resilience_notes=resilience_notes,
            operational_controls=operational_controls,
            risk_flags=risk_flags,
            services=services,
            connections=connections,
            explanation_sections=explanation_sections,
            recommended_next_steps=next_steps,
            confidence_score=confidence_score,
            classification_confidence=intent.classification_confidence,
            matched_pattern=matched_pattern,
            retrieval_matches=intent.retrieval_matches,
            validator_findings=validator_findings,
            mermaid=mermaid,
            iac_template=iac_template,
        )
        if created_at is not None:
            response.created_at = created_at
        return response

    def _normalize_services(self, services):
        normalized: list = []
        counters: dict[str, int] = {}
        seen_ids: set[str] = set()

        for service in services:
            counters[service.type.value] = counters.get(service.type.value, 0) + 1
            fallback_id = (
                service.type.value
                if counters[service.type.value] == 1
                else f"{service.type.value}_{counters[service.type.value]}"
            )
            next_id = service.id or fallback_id
            if next_id in seen_ids:
                next_id = fallback_id
            seen_ids.add(next_id)
            normalized.append(service.model_copy(update={"id": next_id}))

        return normalized


architecture_service = ArchitectureService()
