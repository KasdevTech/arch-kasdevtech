from __future__ import annotations

import re
from dataclasses import dataclass

from app.models import SolutionArchetype, SolutionDomain


@dataclass(frozen=True)
class PatternPack:
    id: str
    title: str
    domain: SolutionDomain
    archetype: SolutionArchetype
    keywords: tuple[str, ...]
    expected_components: tuple[str, ...]
    notes: tuple[str, ...]


PATTERN_LIBRARY: tuple[PatternPack, ...] = (
    PatternPack(
        id="transactional-commerce",
        title="Global Transactional Commerce",
        domain=SolutionDomain.web_saas,
        archetype=SolutionArchetype.transactional_saas,
        keywords=(
            "e-commerce",
            "ecommerce",
            "checkout",
            "orders",
            "payments",
            "shopping cart",
            "global traffic",
            "1m users",
        ),
        expected_components=(
            "frontend",
            "api_gateway",
            "backend_api",
            "database",
            "cache",
            "queue",
            "cdn",
            "waf",
            "cicd_pipeline",
        ),
        notes=(
            "Expect edge routing, caching, async workflows, and payment integration boundaries.",
            "High-scale commerce normally requires queueing and cache layers.",
        ),
    ),
    PatternPack(
        id="secure-three-tier",
        title="Secure Three-Tier Application",
        domain=SolutionDomain.enterprise_application,
        archetype=SolutionArchetype.enterprise_system_of_record,
        keywords=(
            "three tier",
            "3 tier",
            "three-tier",
            "web app",
            "frontend",
            "backend",
            "database",
        ),
        expected_components=(
            "frontend",
            "backend_api",
            "database",
            "waf",
            "secrets",
            "private_network",
            "monitoring",
        ),
        notes=(
            "Expect clear presentation, application, and data separation.",
            "Security and monitoring should appear even in starter enterprise designs.",
        ),
    ),
    PatternPack(
        id="ai-governance-platform",
        title="AI Governance And Security Platform",
        domain=SolutionDomain.ai_governance,
        archetype=SolutionArchetype.ai_security_and_compliance,
        keywords=(
            "data leakage",
            "security posture",
            "compliance",
            "governance",
            "azure ai",
            "azure openai",
            "inventory",
            "policy",
            "purview",
            "resource graph",
        ),
        expected_components=(
            "frontend",
            "backend_api",
            "discovery",
            "policy_engine",
            "security_analytics",
            "database",
            "object_storage",
            "analytics",
            "monitoring",
        ),
        notes=(
            "Expect discovery, policy, findings persistence, and reporting layers.",
            "Generic CRUD-style stacks are usually a poor fit for this class of product.",
        ),
    ),
    PatternPack(
        id="rag-copilot",
        title="RAG Copilot Platform",
        domain=SolutionDomain.ai_platform,
        archetype=SolutionArchetype.ai_application_stack,
        keywords=(
            "rag",
            "copilot",
            "chatbot",
            "assistant",
            "embeddings",
            "vector search",
            "knowledge base",
        ),
        expected_components=(
            "frontend",
            "backend_api",
            "ai_model_gateway",
            "search",
            "database",
            "object_storage",
            "monitoring",
        ),
        notes=(
            "Expect model inference and retrieval components in the core flow.",
            "Search and AI gateway should be first-class capabilities.",
        ),
    ),
)


class PatternLibrary:
    def match(self, prompt: str) -> PatternPack | None:
        lowered = prompt.lower()
        best_pack: PatternPack | None = None
        best_score = 0

        for pack in PATTERN_LIBRARY:
            score = sum(1 for keyword in pack.keywords if keyword in lowered)
            if score > best_score:
                best_score = score
                best_pack = pack

        return best_pack if best_score > 0 else None

    def component_overlap_score(
        self,
        expected_components: tuple[str, ...],
        actual_components: list[str],
    ) -> float:
        if not expected_components:
            return 1.0
        actual = set(actual_components)
        matched = sum(1 for component in expected_components if component in actual)
        return matched / len(expected_components)

    def normalize_prompt(self, prompt: str) -> str:
        return re.sub(r"\s+", " ", prompt).strip()


pattern_library = PatternLibrary()
