from __future__ import annotations

from app.models import (
    ArchitectChatRequest,
    ArchitectChatResponse,
    ArchitectureRequest,
    ChatMessage,
    ChatRole,
)
from app.services.architecture_service import architecture_service


class ChatArchitectService:
    GENERATION_HINTS = [
        "design",
        "architecture",
        "build",
        "platform",
        "system",
        "microservices",
        "api",
        "database",
        "frontend",
        "backend",
        "auth",
        "authentication",
        "scalable",
        "availability",
        "compliance",
        "payments",
        "ai",
        "rag",
        "analytics",
        "pipeline",
        "cicd",
        "ci/cd",
    ]

    def respond(self, payload: ArchitectChatRequest) -> ArchitectChatResponse:
        transcript = self._conversation_prompt(payload.messages)
        latest_user_message = self._latest_user_message(payload.messages)

        if not self._is_ready_to_generate(transcript, latest_user_message):
            return ArchitectChatResponse(
                reply=(
                    "I can turn this into an architecture once I have the workload goal, "
                    "main components, scale or availability needs, and any security or compliance constraints."
                ),
                ready_to_generate=False,
            )

        architecture = architecture_service.generate(
            ArchitectureRequest(
                prompt=transcript,
                cloud=payload.cloud,
                include_iac=payload.include_iac,
                preferences=payload.preferences,
            )
        )

        priorities = ", ".join(architecture.priorities[:3]) or "security and resilience"
        highlights = ", ".join(service.cloud_service for service in architecture.services[:4])
        return ArchitectChatResponse(
            reply=(
                f"I generated a {architecture.cloud.value.upper()} {architecture.domain.value.replace('_', ' ')} "
                f"architecture using the {architecture.archetype.value.replace('_', ' ')} pattern. "
                f"It is optimized for {priorities}, and the initial service backbone includes {highlights}."
            ),
            generated_architecture=architecture,
            ready_to_generate=True,
        )

    def _conversation_prompt(self, messages: list[ChatMessage]) -> str:
        relevant_messages = [
            message.content.strip()
            for message in messages
            if message.role == ChatRole.user and message.content.strip()
        ]
        return "\n".join(relevant_messages[-12:])

    def _latest_user_message(self, messages: list[ChatMessage]) -> str:
        for message in reversed(messages):
            if message.role == ChatRole.user:
                return message.content.strip()
        return ""

    def _is_ready_to_generate(self, transcript: str, latest_user_message: str) -> bool:
        lowered_transcript = transcript.lower()
        lowered_latest = latest_user_message.lower()
        matched_hints = sum(
            1 for keyword in self.GENERATION_HINTS if keyword in lowered_transcript
        )
        return len(lowered_latest) >= 20 and matched_hints >= 2


chat_architect_service = ChatArchitectService()
