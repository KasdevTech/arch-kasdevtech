import { startTransition, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { chatWithArchitect } from "../api";
import { ArchitectureBoard } from "../components/ArchitectureBoard";
import { useArchitectureStore } from "../context/ArchitectureStore";
import type {
  ArchitectChatMessage,
  ArchitecturePreferences,
  ArchitectureResponse,
  CloudProvider,
} from "../types";

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

const STARTER_MESSAGES: ArchitectChatMessage[] = [
  {
    role: "assistant",
    content:
      "Describe the system you want to build, and I’ll translate the conversation into an architecture. You can mention scale, cloud, integrations, compliance, or just start with the product idea.",
  },
];

export function ChatPage() {
  const { saveProject } = useArchitectureStore();
  const [messages, setMessages] = useState<ArchitectChatMessage[]>(STARTER_MESSAGES);
  const [draft, setDraft] = useState("");
  const [cloud, setCloud] = useState<CloudProvider>("azure");
  const [includeIac, setIncludeIac] = useState(true);
  const [preferences, setPreferences] =
    useState<ArchitecturePreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [latestArchitecture, setLatestArchitecture] =
    useState<ArchitectureResponse | null>(null);

  const conversationMessages = useMemo(
    () => messages.filter((message) => message.role === "user").length,
    [messages],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || loading) {
      return;
    }

    const nextMessages = [...messages, { role: "user" as const, content }];
    setMessages(nextMessages);
    setDraft("");
    setLoading(true);
    setError("");

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

      setLatestArchitecture(persistedArchitecture);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: response.reply,
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

  return (
    <div className="studio-grid">
      <section className="card panel">
        <div className="section-heading">
          <p className="eyebrow">Architect Chat</p>
          <h2>Talk through the problem, then generate the architecture</h2>
        </div>
        <p className="section-copy">
          Use natural conversation to refine requirements. Once the request is
          concrete enough, the assistant generates a real architecture project
          and saves it into your workspace.
        </p>

        <div className="chat-toolbar">
          <label className="composer-field">
            <span>Cloud</span>
            <select
              value={cloud}
              onChange={(event) => setCloud(event.target.value as CloudProvider)}
            >
              <option value="azure">Azure</option>
              <option value="aws">AWS</option>
              <option value="gcp">GCP</option>
            </select>
          </label>
          <label className="toggle-field">
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
          <label className="toggle-field">
            <input
              checked={includeIac}
              onChange={(event) => setIncludeIac(event.target.checked)}
              type="checkbox"
            />
            <span>Include IaC</span>
          </label>
        </div>

        <div className="chat-thread">
          {messages.map((message, index) => (
            <article
              key={`${message.role}-${index}`}
              className={
                message.role === "assistant" ? "chat-bubble assistant" : "chat-bubble user"
              }
            >
              <span className="chat-role">
                {message.role === "assistant" ? "Architect" : "You"}
              </span>
              <p>{message.content}</p>
            </article>
          ))}
        </div>

        <form className="chat-composer" onSubmit={handleSubmit}>
          <label className="composer-field">
            <span>Message</span>
            <textarea
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Design a global payments platform on Azure with PCI controls, fraud integrations, HA, and CI/CD."
              rows={6}
              value={draft}
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <div className="action-row">
            <button className="button-link primary" disabled={loading} type="submit">
              {loading ? "Thinking..." : "Send to Architect"}
            </button>
            <span className="inline-helper">
              {conversationMessages} user message{conversationMessages === 1 ? "" : "s"} in context
            </span>
          </div>
        </form>
      </section>

      <div className="page-stack">
        <section className="card panel">
          <div className="section-heading">
            <p className="eyebrow">How it works</p>
            <h2>Conversation first, architecture when ready</h2>
          </div>
          <ul className="detail-list">
            <li>Chat through the product idea, integrations, scale, and compliance needs.</li>
            <li>The assistant uses the conversation context, not just the last sentence.</li>
            <li>When the request is concrete enough, it generates a full architecture automatically.</li>
            <li>The generated architecture is saved into your project library for editing and export.</li>
          </ul>
        </section>

        {latestArchitecture ? (
          <section className="card panel">
            <div className="section-heading">
              <p className="eyebrow">Latest Result</p>
              <h2>{latestArchitecture.title}</h2>
            </div>
            <p className="project-summary">{latestArchitecture.summary}</p>
            <div className="action-row">
              <Link
                className="button-link secondary"
                to={`/app/projects/${latestArchitecture.request_id}/overview`}
              >
                Open project
              </Link>
              <Link
                className="button-link secondary"
                to={`/app/projects/${latestArchitecture.request_id}/architecture`}
              >
                Open architecture
              </Link>
            </div>
            <ArchitectureBoard
              architecture={latestArchitecture}
              readOnly
              showConnectionLabels={false}
            />
          </section>
        ) : (
          <section className="card panel">
            <div className="section-heading">
              <p className="eyebrow">Generated Output</p>
              <h2>Your architecture will appear here</h2>
            </div>
            <div className="empty-state subtle">
              <p>Start the conversation with a real workload idea.</p>
              <span>
                Once the request has enough context, the assistant will generate
                and save a project automatically.
              </span>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
