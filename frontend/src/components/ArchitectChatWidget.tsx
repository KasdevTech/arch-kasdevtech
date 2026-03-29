import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { chatWithArchitect } from "../api";
import { ArchitectureBoard } from "./ArchitectureBoard";
import { useArchitectureStore } from "../context/ArchitectureStore";
import type {
  ArchitecturePreferences,
  ArchitectureResponse,
  CloudProvider,
} from "../types";

type ChatEntry = {
  role: "user" | "assistant";
  content: string;
  architecture?: ArchitectureResponse | null;
};

const DEFAULT_PREFERENCES: ArchitecturePreferences = {
  workload_name: null,
  environments: ["dev", "staging", "prod"],
  availability_tier: "high_availability",
  data_sensitivity: "confidential",
  network_exposure: "public",
  user_scale: "business",
  compliance_frameworks: [],
  multi_region: false,
  disaster_recovery: true,
  tenancy: "pooled_multi_tenant",
};

const STARTER_MESSAGES: ChatEntry[] = [
  {
    role: "assistant",
    content:
      "Describe the system you want to build, and I’ll help shape the architecture, explain tradeoffs, and generate a cloud design when the idea is ready.",
  },
];

const QUICK_PROMPTS = [
  "Design a secure three-tier app on Azure",
  "Compare App Service vs Container Apps",
  "Build a global e-commerce architecture",
] as const;

const CHAT_STORAGE_KEY = "ai-architect-chat-session";
const CHAT_OPEN_KEY = "ai-architect-chat-open";

type PersistedChatSession = {
  messages: ChatEntry[];
  cloud: CloudProvider;
  includeIac: boolean;
  preferences: ArchitecturePreferences;
};

export function ArchitectChatWidget() {
  const { saveProject } = useArchitectureStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatEntry[]>(STARTER_MESSAGES);
  const [draft, setDraft] = useState("");
  const [cloud, setCloud] = useState<CloudProvider>("azure");
  const [includeIac, setIncludeIac] = useState(true);
  const [preferences, setPreferences] =
    useState<ArchitecturePreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const threadRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const conversationMessages = useMemo(
    () => messages.filter((message) => message.role === "user").length,
    [messages],
  );

  const canShowSuggestions = conversationMessages === 0 && messages.length <= 1;

  useEffect(() => {
    try {
      const rawSession = window.localStorage.getItem(CHAT_STORAGE_KEY);
      const rawOpen = window.localStorage.getItem(CHAT_OPEN_KEY);

      if (rawSession) {
        const parsed = JSON.parse(rawSession) as Partial<PersistedChatSession>;
        if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
          setMessages(parsed.messages);
        }
        if (parsed.cloud) {
          setCloud(parsed.cloud);
        }
        if (typeof parsed.includeIac === "boolean") {
          setIncludeIac(parsed.includeIac);
        }
        if (parsed.preferences) {
          setPreferences({
            ...DEFAULT_PREFERENCES,
            ...parsed.preferences,
          });
        }
      }

      if (rawOpen === "true") {
        setIsOpen(true);
      }
    } catch {
      window.localStorage.removeItem(CHAT_STORAGE_KEY);
      window.localStorage.removeItem(CHAT_OPEN_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const payload: PersistedChatSession = {
      messages,
      cloud,
      includeIac,
      preferences,
    };
    window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(payload));
    window.localStorage.setItem(CHAT_OPEN_KEY, String(isOpen));
  }, [hydrated, messages, cloud, includeIac, preferences, isOpen]);

  useEffect(() => {
    const threadElement = threadRef.current;
    if (!threadElement) {
      return;
    }

    threadElement.scrollTop = threadElement.scrollHeight;
  }, [messages, loading, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    inputRef.current?.focus();
  }, [isOpen]);

  async function submitContent(content: string) {
    const trimmed = content.trim();
    if (!trimmed || loading) {
      return;
    }

    const nextMessages = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(nextMessages);
    setDraft("");
    setError("");
    setIsOpen(true);

    setLoading(true);

    try {
      const response = await chatWithArchitect({
        messages: nextMessages,
        cloud,
        include_iac: includeIac,
        preferences,
      });

      let persistedArchitecture: ArchitectureResponse | null = null;
      if (response.generated_architecture) {
        persistedArchitecture = {
          ...response.generated_architecture,
          source_request: {
            prompt: nextMessages
              .filter((message) => message.role === "user")
          .map((message) => message.content)
          .join("\n"),
            cloud,
            include_iac: includeIac,
            preferences,
          },
        };
        startTransition(() => {
          saveProject(persistedArchitecture as ArchitectureResponse);
        });
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: response.reply,
          architecture: persistedArchitecture,
        },
      ]);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to reach architect chat right now.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitContent(draft);
  }

  async function submitPrompt(content: string) {
    await submitContent(content);
  }

  function handleNewChat() {
    setMessages(STARTER_MESSAGES);
    setDraft("");
    setError("");
    setLoading(false);
    setCloud("azure");
    setIncludeIac(true);
    setPreferences(DEFAULT_PREFERENCES);
    window.localStorage.removeItem(CHAT_STORAGE_KEY);
  }

  function handleComposerKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();
    void handleSubmit(event as unknown as React.FormEvent<HTMLFormElement>);
  }

  return (
    <div className="chat-widget-shell">
      {isOpen ? (
        <section className="chat-widget">
          <header className="chat-widget-header">
            <div className="chat-widget-heading">
              <p className="eyebrow">KasdevTech Copilot</p>
              <h2>Architecture Copilot</h2>
              <p className="chat-widget-subtitle">
                Ask architecture questions, pressure-test design choices, or
                turn a prompt into a cloud solution.
              </p>
            </div>
            <div className="chat-widget-actions">
              <button
                className="chat-toolbar-button"
                onClick={() => setShowOptions((current) => !current)}
                type="button"
              >
                {showOptions ? "Hide context" : "Context"}
              </button>
              <button
                className="chat-toolbar-button"
                onClick={handleNewChat}
                type="button"
              >
                New chat
              </button>
              <button
                aria-label="Close chat"
                className="chat-close-button"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                ×
              </button>
            </div>
          </header>

          {showOptions ? (
            <div className="chat-widget-toolbar">
              <label className="composer-field chat-option-field">
                <span>Cloud target</span>
                <select
                  value={cloud}
                  onChange={(event) => setCloud(event.target.value as CloudProvider)}
                >
                  <option value="azure">Azure</option>
                  <option value="aws">AWS</option>
                  <option value="gcp">GCP</option>
                </select>
              </label>
              <label className="toggle-field compact">
                <input
                  checked={preferences.multi_region}
                  onChange={(event) =>
                    setPreferences((current) => ({
                      ...current,
                      multi_region: event.target.checked,
                    }))
                  }
                  type="checkbox"
                />
                <span>Multi-region</span>
              </label>
              <label className="toggle-field compact">
                <input
                  checked={includeIac}
                  onChange={(event) => setIncludeIac(event.target.checked)}
                  type="checkbox"
                />
                <span>Starter IaC</span>
              </label>
            </div>
          ) : (
            <div className="chat-widget-status">
              <span>{cloud.toUpperCase()}</span>
              <span>
                {preferences.multi_region ? "Multi-region" : "Single region"}
              </span>
              <span>{includeIac ? "IaC ready" : "Diagram only"}</span>
            </div>
          )}

          <div className="chat-widget-thread" ref={threadRef}>
            {canShowSuggestions ? (
              <section className="chat-suggestion-strip">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    className="chat-suggestion"
                    onClick={() => {
                      void submitPrompt(prompt);
                    }}
                    type="button"
                  >
                    {prompt}
                  </button>
                ))}
              </section>
            ) : null}
            {messages.map((message, index) => (
              <article
                key={`${message.role}-${index}`}
                className={
                  message.role === "assistant"
                    ? "chat-bubble assistant"
                    : "chat-bubble user"
                }
              >
                <span className="chat-role">
                  {message.role === "assistant" ? "Copilot" : "You"}
                </span>
                <p>{message.content}</p>
                {message.architecture ? (
                  <div className="chat-architecture">
                    <div className="chat-architecture-head">
                      <div>
                        <strong>{message.architecture.title}</strong>
                        <span>{message.architecture.summary}</span>
                      </div>
                      <div className="action-row">
                        <Link
                          className="button-link secondary"
                          to={`/app/projects/${message.architecture.request_id}/overview`}
                        >
                          Open project
                        </Link>
                      </div>
                    </div>
                    <ArchitectureBoard
                      architecture={message.architecture}
                      readOnly
                      showConnectionLabels={false}
                    />
                  </div>
                ) : null}
              </article>
            ))}
            {loading ? (
              <article className="chat-bubble assistant">
                <span className="chat-role">Copilot</span>
                <p>Thinking through the architecture and shaping the response...</p>
              </article>
            ) : null}
          </div>

          <form className="chat-widget-composer" onSubmit={handleSubmit}>
            <textarea
              ref={inputRef}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder="Ask a question or describe the system you want to design..."
              rows={2}
              value={draft}
            />
            {error ? <p className="form-error">{error}</p> : null}
            <div className="chat-widget-footer">
              <span className="inline-helper">
                Enter to send. Shift+Enter for a new line.
              </span>
              <span className="inline-helper">
                {conversationMessages} user message
                {conversationMessages === 1 ? "" : "s"} in context
              </span>
            </div>
          </form>
        </section>
      ) : null}

      <button
        className="chat-launcher"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className="chat-launcher-icon">⌁</span>
        <span className="chat-launcher-copy">
          <strong>Architecture Copilot</strong>
          <small>Ask, refine, generate</small>
        </span>
      </button>
    </div>
  );
}
