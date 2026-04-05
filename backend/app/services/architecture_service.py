from __future__ import annotations

from uuid import uuid4

from app.models import ArchitectureRequest, ArchitectureResponse
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
        iac_template = self.iac_service.build(intent, services) if payload.include_iac else None
        confidence_score, matched_pattern, validator_findings = architecture_validator.validate(
            intent,
            services,
        )

        return ArchitectureResponse(
            request_id=str(uuid4()),
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


architecture_service = ArchitectureService()
