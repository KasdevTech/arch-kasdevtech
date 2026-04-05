from __future__ import annotations

import math
import re
from dataclasses import dataclass

from app.models import SolutionArchetype, SolutionDomain
from app.services.pattern_library import PATTERN_LIBRARY, PatternPack


@dataclass(frozen=True)
class ClassifierPrediction:
    pattern_id: str
    title: str
    domain: SolutionDomain
    archetype: SolutionArchetype
    confidence: float


class LightweightArchitectureClassifier:
    def __init__(self) -> None:
        self._documents = self._build_documents()
        self._vocabulary = self._build_vocabulary()
        self._priors = self._build_priors()

    def predict(self, prompt: str) -> ClassifierPrediction | None:
        tokens = self._tokens(prompt)
        if not tokens:
            return None

        token_counts: dict[str, int] = {}
        for token in tokens:
            token_counts[token] = token_counts.get(token, 0) + 1

        scored: list[tuple[PatternPack, float]] = []
        vocab_size = max(1, len(self._vocabulary))

        for pack in PATTERN_LIBRARY:
            model_counts = self._documents[pack.id]
            total = sum(model_counts.values())
            log_prob = math.log(self._priors[pack.id])
            for token, count in token_counts.items():
                likelihood = (model_counts.get(token, 0) + 1) / (total + vocab_size)
                log_prob += count * math.log(likelihood)
            scored.append((pack, log_prob))

        scored.sort(key=lambda item: item[1], reverse=True)
        best_pack, best_log = scored[0]
        second_log = scored[1][1] if len(scored) > 1 else best_log - 1.5
        margin = best_log - second_log
        confidence = round(min(0.99, max(0.18, 0.5 + (margin / 6))), 3)

        return ClassifierPrediction(
            pattern_id=best_pack.id,
            title=best_pack.title,
            domain=best_pack.domain,
            archetype=best_pack.archetype,
            confidence=confidence,
        )

    def _build_documents(self) -> dict[str, dict[str, int]]:
        documents: dict[str, dict[str, int]] = {}
        for pack in PATTERN_LIBRARY:
            corpus = " ".join(pack.keywords + pack.notes + pack.example_prompts)
            counts: dict[str, int] = {}
            for token in self._tokens(corpus):
                counts[token] = counts.get(token, 0) + 1
            documents[pack.id] = counts
        return documents

    def _build_vocabulary(self) -> set[str]:
        vocab: set[str] = set()
        for counts in self._documents.values():
            vocab.update(counts)
        return vocab

    def _build_priors(self) -> dict[str, float]:
        total = len(PATTERN_LIBRARY)
        return {pack.id: 1 / total for pack in PATTERN_LIBRARY}

    def _tokens(self, text: str) -> list[str]:
        return re.findall(r"[a-z0-9_+-]+", text.lower())


architecture_classifier = LightweightArchitectureClassifier()
