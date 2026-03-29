from __future__ import annotations

import json
import re
from typing import Any, Optional

from app.core.config import settings
from app.models import (
    ArchitectChatRequest,
    ArchitectChatResponse,
    ArchitectureRequest,
    ChatMessage,
    ChatRole,
)
from app.services.architecture_service import architecture_service
from app.services.prompt_templates import (
    CHAT_ASSISTANT_SYSTEM_PROMPT,
    CHAT_ROUTER_SYSTEM_PROMPT,
)


class ChatArchitectService:
    def respond(self, payload: ArchitectChatRequest) -> ArchitectChatResponse:
        transcript = self._conversation_prompt(payload.messages)
        latest_user_message = self._latest_user_message(payload.messages)

        if not latest_user_message.strip():
            return ArchitectChatResponse(
                reply="Tell me what you want to build, and I’ll help shape the architecture.",
                ready_to_generate=False,
            )

        decision = self._route_conversation(payload)

        if decision["mode"] != "generate":
            return ArchitectChatResponse(
                reply=decision["reply"],
                ready_to_generate=False,
            )

        architecture_prompt = (
            decision.get("architecture_prompt") or transcript or latest_user_message
        )
        architecture = architecture_service.generate(
            ArchitectureRequest(
                prompt=architecture_prompt,
                cloud=payload.cloud,
                include_iac=payload.include_iac,
                preferences=payload.preferences,
            )
        )

        reply = decision.get("reply") or self._generated_reply(architecture)
        return ArchitectChatResponse(
            reply=reply,
            generated_architecture=architecture,
            ready_to_generate=True,
        )

    def _route_conversation(self, payload: ArchitectChatRequest) -> dict[str, Any]:
        try:
            routed = self._route_with_llm(payload)
            if routed:
                return routed
        except Exception:
            pass
        return self._fallback_decision(payload)

    def _route_with_llm(self, payload: ArchitectChatRequest) -> dict[str, Any] | None:
        client, model = self._build_llm_client()
        if client is None or not model:
            return None

        completion = client.chat.completions.create(
            model=model,
            temperature=0.2,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": CHAT_ROUTER_SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": self._router_context(payload),
                },
            ],
        )
        content = completion.choices[0].message.content or "{}"
        parsed = json.loads(content)
        return self._normalize_llm_decision(parsed, payload)

    def _normalize_llm_decision(
        self,
        payload: dict[str, Any],
        request: ArchitectChatRequest,
    ) -> dict[str, Any]:
        mode = str(payload.get("mode") or "reply").strip().lower()
        if mode not in {"reply", "clarify", "generate"}:
            mode = "reply"

        reply = str(payload.get("reply") or "").strip()
        architecture_prompt = payload.get("architecture_prompt")
        if architecture_prompt is not None:
            architecture_prompt = str(architecture_prompt).strip() or None

        if mode == "generate":
            return {
                "mode": "generate",
                "reply": reply,
                "architecture_prompt": architecture_prompt
                or self._conversation_prompt(request.messages),
            }

        if not reply:
            latest = self._latest_user_message(request.messages)
            if mode == "clarify":
                reply = self._clarify_reply(latest)
            else:
                reply = self._fallback_reply(latest)

        return {
            "mode": mode,
            "reply": reply,
            "architecture_prompt": None,
        }

    def _router_context(self, payload: ArchitectChatRequest) -> str:
        transcript = "\n".join(
            f"{message.role.value}: {message.content.strip()}"
            for message in payload.messages[-12:]
            if message.content.strip()
        )
        return (
            f"Preferred cloud: {payload.cloud.value}\n"
            f"Include IaC: {'yes' if payload.include_iac else 'no'}\n"
            f"Multi-region: {'yes' if payload.preferences.multi_region else 'no'}\n"
            f"Availability tier: {payload.preferences.availability_tier.value}\n"
            f"Data sensitivity: {payload.preferences.data_sensitivity.value}\n"
            f"Conversation:\n{transcript}"
        )

    def _generated_reply(self, architecture: Any) -> str:
        priorities = ", ".join(architecture.priorities[:3]) or "security and resilience"
        highlights = ", ".join(service.cloud_service for service in architecture.services[:4])
        return (
            f"I generated a {architecture.cloud.value.upper()} "
            f"{architecture.domain.value.replace('_', ' ')} architecture using the "
            f"{architecture.archetype.value.replace('_', ' ')} pattern. "
            f"It is optimized for {priorities}, and the initial service backbone includes {highlights}."
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

    def _fallback_decision(self, payload: ArchitectChatRequest) -> dict[str, Any]:
        latest = self._latest_user_message(payload.messages)
        normalized = latest.strip().lower()

        quick_reply = self._quick_reply(normalized)
        if quick_reply:
            return {
                "mode": "reply",
                "reply": quick_reply,
                "architecture_prompt": None,
            }

        if self._is_garbled(normalized):
            return {
                "mode": "clarify",
                "reply": "I didn’t quite catch that. Rephrase your question or describe the system you want to design.",
                "architecture_prompt": None,
            }

        if self._is_ready_to_generate(
            self._conversation_prompt(payload.messages),
            latest,
        ):
            return {
                "mode": "generate",
                "reply": "",
                "architecture_prompt": self._conversation_prompt(payload.messages),
            }

        if self._looks_like_question(normalized):
            return {
                "mode": "reply",
                "reply": self._question_reply(latest, payload.cloud.value),
                "architecture_prompt": None,
            }

        return {
            "mode": "clarify",
            "reply": self._clarify_reply(latest),
            "architecture_prompt": None,
        }

    def _quick_reply(self, normalized: str) -> str | None:
        quick_replies = {
            "hi": "Hi. What are you designing today?",
            "hello": "Hi. What are you designing today?",
            "hey": "Hey. What system are you thinking about?",
            "how are you": "I’m doing well and ready to help with architecture. What are you working on?",
            "how are you?": "I’m doing well and ready to help with architecture. What are you working on?",
            "thanks": "You’re welcome. If you want, we can keep refining the architecture.",
            "thank you": "You’re welcome. If you want, we can keep refining the architecture.",
            "ok": "Alright. Tell me what you want to build or ask an architecture question.",
            "okay": "Alright. Tell me what you want to build or ask an architecture question.",
        }
        direct = quick_replies.get(normalized)
        if direct:
            return direct
        if any(
            phrase in normalized
            for phrase in [
                "what can you do",
                "what are you capable of",
                "help me",
                "capabilities",
                "what do you do",
            ]
        ):
            return (
                "I can answer architecture questions, compare cloud services, explain tradeoffs, "
                "and generate cloud architectures with diagrams and starter implementation guidance."
            )
        return None

    def _fallback_reply(self, latest_user_message: str) -> str:
        if len(latest_user_message.strip()) < 8:
            return "Tell me a bit more, or describe the system you want to design."
        return (
            "I can help with architecture questions, design tradeoffs, and full solution design. "
            "Tell me what you’re building, or ask a cloud architecture question."
        )

    def _question_reply(self, latest_user_message: str, cloud: str) -> str:
        heuristic_reply = self._heuristic_question_reply(latest_user_message, cloud)
        if heuristic_reply:
            return heuristic_reply

        try:
            reply = self._reply_with_llm(
                [ChatMessage(role=ChatRole.user, content=latest_user_message)],
                cloud,
            )
            if reply:
                return reply
        except Exception:
            pass
        return self._fallback_reply(latest_user_message)

    def _heuristic_question_reply(
        self,
        latest_user_message: str,
        cloud: str,
    ) -> str | None:
        lowered = latest_user_message.lower()
        if (
            "app service" in lowered
            and "container apps" in lowered
            and ("difference" in lowered or "vs" in lowered)
        ):
            return (
                f"On {cloud.upper()}, App Service is simpler for conventional web apps and APIs, "
                "while Container Apps is better when you want container-based deployment, microservices, "
                "event-driven scale, or background workers. If you want, I can map the tradeoffs to your workload."
            )
        if "three tier" in lowered or "3 tier" in lowered or "three-tier" in lowered:
            return (
                "A three-tier architecture usually separates presentation, application logic, and data. "
                "If you want, I can generate a starter cloud design for that right now."
            )
        return None

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

    def _clarify_reply(self, latest_user_message: str) -> str:
        if self._is_garbled(latest_user_message.lower()):
            return "I didn’t quite catch that. Rephrase your question or describe the system you want to design."
        return (
            "I can help with architecture questions or generate a design. "
            "Tell me what you want to build, the main components, or the cloud you have in mind."
        )

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
                "propose an architecture",
            ]
        ):
            return False

        matched_hints = sum(
            1
            for keyword in [
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
            if keyword in lowered_transcript
        )
        if any(
            phrase in lowered_latest
            for phrase in ["three tier", "3 tier", "three-tier", "starter app", "sample app"]
        ):
            return True
        return len(lowered_latest) >= 12 and matched_hints >= 2

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

    def _is_garbled(self, lowered_message: str) -> bool:
        stripped = lowered_message.strip()
        if not stripped:
            return True
        letters = re.findall(r"[a-z]", stripped)
        if not letters and len(stripped) < 8:
            return True
        if len(letters) <= 2 and len(stripped) <= 6:
            return True
        if re.fullmatch(r"[\W_]+", stripped):
            return True
        return False


chat_architect_service = ChatArchitectService()
