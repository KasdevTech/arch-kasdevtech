from __future__ import annotations

import math
import re
from dataclasses import dataclass

from app.models import ArchitectureRetrievalMatch, SolutionArchetype, SolutionDomain


@dataclass(frozen=True)
class PatternPack:
    id: str
    title: str
    domain: SolutionDomain
    archetype: SolutionArchetype
    keywords: tuple[str, ...]
    expected_components: tuple[str, ...]
    notes: tuple[str, ...]
    example_prompts: tuple[str, ...]


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
        example_prompts=(
            "Design a global e-commerce platform with secure checkout, high availability, and microservices.",
            "Build an internet-scale online store on Azure with payments, cache, queue, and CDN.",
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
        example_prompts=(
            "Design a secure three-tier application with frontend, backend, and database.",
            "Build a standard enterprise web app with presentation, application, and data layers.",
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
        example_prompts=(
            "Build a SaaS platform that discovers Azure AI services and reports compliance and data leakage risks.",
            "Design an AI governance platform with discovery, policy, security analytics, and reporting.",
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
        example_prompts=(
            "Design a RAG copilot with embeddings, vector search, and secure prompt orchestration.",
            "Build an AI assistant platform with retrieval and model inference.",
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

    def rank(self, prompt: str, limit: int = 3) -> list[ArchitectureRetrievalMatch]:
        lowered = self.normalize_prompt(prompt).lower()
        prompt_tokens = self._tokens(lowered)
        scores: list[ArchitectureRetrievalMatch] = []

        for pack in PATTERN_LIBRARY:
            corpus_tokens = self._tokens(" ".join(pack.keywords + pack.notes + pack.example_prompts))
            score = self._cosine_like_score(prompt_tokens, corpus_tokens)
            keyword_boost = sum(0.08 for keyword in pack.keywords if keyword in lowered)
            example_boost = sum(
                0.06
                for example in pack.example_prompts
                if any(token in example.lower() for token in prompt_tokens)
            )
            final_score = round(min(0.99, score + keyword_boost + min(0.12, example_boost)), 3)
            if final_score > 0:
                scores.append(
                    ArchitectureRetrievalMatch(
                        pattern_id=pack.id,
                        title=pack.title,
                        domain=pack.domain,
                        archetype=pack.archetype,
                        score=final_score,
                    )
                )

        scores.sort(key=lambda item: item.score, reverse=True)
        return scores[:limit]

    def _tokens(self, text: str) -> list[str]:
        return re.findall(r"[a-z0-9_+-]+", text.lower())

    def _cosine_like_score(self, left: list[str], right: list[str]) -> float:
        if not left or not right:
            return 0.0

        left_counts: dict[str, int] = {}
        right_counts: dict[str, int] = {}
        for token in left:
            left_counts[token] = left_counts.get(token, 0) + 1
        for token in right:
            right_counts[token] = right_counts.get(token, 0) + 1

        intersection = set(left_counts) & set(right_counts)
        dot = sum(left_counts[token] * right_counts[token] for token in intersection)
        left_norm = math.sqrt(sum(value * value for value in left_counts.values()))
        right_norm = math.sqrt(sum(value * value for value in right_counts.values()))
        if left_norm == 0 or right_norm == 0:
            return 0.0
        return dot / (left_norm * right_norm)


pattern_library = PatternLibrary()
