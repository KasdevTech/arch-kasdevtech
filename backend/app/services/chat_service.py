from __future__ import annotations

from typing import Optional

from app.core.config import settings
from app.models import (
    ArchitectChatRequest,
    ArchitectChatResponse,
    ArchitectureRequest,
    ChatMessage,
    ChatRole,
)
from app.services.architecture_service import architecture_service
from app.services.prompt_templates import CHAT_ASSISTANT_SYSTEM_PROMPT


class ChatArchitectService:
    QUICK_REPLIES = {
        "hi": "Hi. Tell me what you want to build, or ask me an architecture question.",
        "hello": "Hi. Tell me what you want to build, or ask me an architecture question.",
        "hey": "Hey. Tell me what you want to build, or ask me an architecture question.",
        "how are you": "I’m doing well and ready to help. Tell me what you want to build, or ask me an architecture question.",
        "how are you?": "I’m doing well and ready to help. Tell me what you want to build, or ask me an architecture question.",
        "thanks": "You’re welcome. Tell me what you want to build next, or ask me an architecture question.",
        "thank you": "You’re welcome. Tell me what you want to build next, or ask me an architecture question.",
        "ok": "Alright. Tell me what you want to build, and I’ll help shape the architecture.",
        "okay": "Alright. Tell me what you want to build, and I’ll help shape the architecture.",
        "cool": "Nice. Tell me what you want to build, or ask me an architecture question.",
        "great": "Great. Tell me what you want to build, or ask me an architecture question.",
    }

    GENERATION_HINTS = [
        "design",
        "architecture",
        "build",
        "app",
        "application",
        "platform",
        "system",
        "three tier",
        "3 tier",
        "three-tier",
        "starter app",
        "sample app",
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
        quick_reply = self._quick_reply(latest_user_message)

        if quick_reply is not None:
            return ArchitectChatResponse(
                reply=quick_reply,
                ready_to_generate=False,
            )

        if not self._is_ready_to_generate(transcript, latest_user_message):
            try:
                llm_reply = self._reply_with_llm(payload.messages, payload.cloud.value)
            except Exception:
                llm_reply = None
            return ArchitectChatResponse(
                reply=llm_reply or self._fallback_reply(latest_user_message),
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

        if self._looks_like_question(lowered_latest) and not any(
            phrase in lowered_latest
            for phrase in [
                "design ",
                "build ",
                "generate ",
                "create ",
                "show me an architecture",
                "give me an architecture",
            ]
        ):
            return False

        matched_hints = sum(
            1 for keyword in self.GENERATION_HINTS if keyword in lowered_transcript
        )
        if any(
            phrase in lowered_latest
            for phrase in ["three tier", "3 tier", "three-tier", "starter app", "sample app"]
        ):
            return True
        return len(lowered_latest) >= 12 and matched_hints >= 2

    def _reply_with_llm(
        self,
        messages: list[ChatMessage],
        cloud: str,
    ) -> Optional[str]:
        client, model = self._build_llm_client()
        if client is None or not model:
            return None

        completion = client.chat.completions.create(
            model=model,
            temperature=0.4,
            messages=[
                {
                    "role": "system",
                    "content": (
                        f"{CHAT_ASSISTANT_SYSTEM_PROMPT}\n"
                        f"Current preferred cloud: {cloud}."
                    ),
                },
                *[
                    {"role": message.role.value, "content": message.content}
                    for message in messages[-12:]
                ],
            ],
        )
        content = completion.choices[0].message.content
        if not content:
            return None
        return content.strip()

    def _build_llm_client(self) -> tuple[object | None, str]:
        try:
            from openai import OpenAI
        except ImportError:
            return None, ""

        if settings.llm_service_base_url:
            return (
                OpenAI(
                    api_key=settings.llm_service_api_key or "local-service",
                    base_url=settings.llm_service_base_url,
                ),
                settings.llm_service_model or "local-model",
            )

        if settings.openai_api_key:
            return (
                OpenAI(api_key=settings.openai_api_key),
                settings.openai_model,
            )

        return None, ""

    def _fallback_reply(self, latest_user_message: str) -> str:
        if len(latest_user_message.strip()) < 12:
            return "Tell me a bit more about what you want to build, and I’ll help shape it."

        return (
            "I can help with both general architecture questions and full solution design. "
            "If you want an architecture, tell me the workload goal, main components, scale, "
            "and any security or compliance constraints."
        )

    def _quick_reply(self, latest_user_message: str) -> str | None:
        normalized = latest_user_message.strip().lower()
        if not normalized:
            return "Tell me what you want to build, and I’ll help shape the architecture."
        return self.QUICK_REPLIES.get(normalized)

    def _looks_like_question(self, lowered_message: str) -> bool:
        if "?" in lowered_message:
            return True
        return lowered_message.startswith(
            (
                "what ",
                "why ",
                "when ",
                "which ",
                "who ",
                "where ",
                "how ",
                "should ",
                "can ",
                "could ",
                "would ",
                "is ",
                "are ",
                "do ",
                "does ",
            )
        )


chat_architect_service = ChatArchitectService()
