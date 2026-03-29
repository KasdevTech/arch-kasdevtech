import { startTransition, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { generateArchitecture } from "../api";
import { ArchitectureBoard } from "../components/ArchitectureBoard";
import { ArchitectureComposer } from "../components/ArchitectureComposer";
import { ProjectCard } from "../components/ProjectCard";
import { useArchitectureStore } from "../context/ArchitectureStore";
import { ARCHITECTURE_TEMPLATES } from "../data/catalog";
import type { ArchitectureRequest, ArchitectureResponse } from "../types";

function buildEditableRequest(
  project: ArchitectureResponse | undefined,
): ArchitectureRequest | undefined {
  if (!project) {
    return undefined;
  }

  return (
    project.source_request ?? {
      prompt: project.summary,
      cloud: project.cloud,
      include_iac: Boolean(project.iac_template),
      preferences: project.preferences,
    }
  );
}

export function StudioPage() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { getProject, projects, saveProject } = useArchitectureStore();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    ARCHITECTURE_TEMPLATES[0]?.id ?? "",
  );
  const editingProject = projectId ? getProject(projectId) : undefined;
  const initialRequest = buildEditableRequest(editingProject);
  const selectedTemplate = useMemo(
    () =>
      ARCHITECTURE_TEMPLATES.find((template) => template.id === selectedTemplateId) ??
      ARCHITECTURE_TEMPLATES[0],
    [selectedTemplateId],
  );

  async function handleGenerate(payload: ArchitectureRequest) {
    setLoading(true);
    setError("");

    try {
      const response = await generateArchitecture(payload);
      const persistedProject: ArchitectureResponse = editingProject
        ? {
            ...response,
            request_id: editingProject.request_id,
            source_request: payload,
          }
        : {
            ...response,
            source_request: payload,
          };
      startTransition(() => {
        saveProject(persistedProject);
      });
      navigate(
        `/app/projects/${persistedProject.request_id}/overview`,
      );
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to generate architecture right now.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="studio-grid">
      <ArchitectureComposer
        error={error}
        initialRequest={initialRequest}
        loading={loading}
        mode={editingProject ? "edit" : "create"}
        onGenerate={handleGenerate}
        presetRequest={editingProject ? undefined : selectedTemplate?.request}
      />

      <div className="page-stack">
        <section className="card panel">
          <div className="section-heading">
            <p className="eyebrow">Studio Notes</p>
            <h2>
              {editingProject
                ? `Editing ${editingProject.title}`
                : "What this workspace now does"}
            </h2>
          </div>
          <ul className="detail-list">
            <li>Creates a saved project instead of rendering everything inline on the same page.</li>
            <li>Routes every generated architecture into its own detail page.</li>
            <li>Preserves a library of projects in local storage for repeat review.</li>
            <li>Separates marketing, creation, library, and report surfaces like a SaaS app.</li>
            <li>Supports editing an existing project and saving back into the same project record.</li>
          </ul>
          {editingProject ? (
            <div className="action-row">
              <Link
                className="button-link secondary"
                to={`/app/projects/${editingProject.request_id}/overview`}
              >
                Cancel editing
              </Link>
            </div>
          ) : null}
        </section>

        {!editingProject ? (
          <section className="card panel">
            <div className="section-heading">
              <p className="eyebrow">Blueprint Starters</p>
              <h2>Start from enterprise-ready reference patterns</h2>
            </div>
            <p className="section-copy">
              Pick a reference blueprint to prefill the studio with a realistic
              enterprise workload, then tailor the prompt and controls before
              generating your own project.
            </p>

            <div className="template-grid">
              {ARCHITECTURE_TEMPLATES.map((template) => (
                <article
                  key={template.id}
                  className={
                    template.id === selectedTemplate?.id
                      ? "template-card is-active"
                      : "template-card"
                  }
                >
                  <div className="project-card-head">
                    <div>
                      <p className="eyebrow">Template</p>
                      <h3>{template.title}</h3>
                    </div>
                    <button
                      className="secondary-button"
                      onClick={() => setSelectedTemplateId(template.id)}
                      type="button"
                    >
                      Use template
                    </button>
                  </div>
                  <p className="project-summary">{template.description}</p>
                  <div className="pill-row">
                    {template.tags.map((tag) => (
                      <span className="priority-pill" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            {selectedTemplate ? (
              <ArchitectureBoard
                architecture={selectedTemplate.preview}
                readOnly
                showLegend={false}
                showToolbar={false}
                showConnectionLabels={false}
              />
            ) : null}
          </section>
        ) : null}

        <section className="card panel">
          <div className="section-heading">
            <p className="eyebrow">Recent Projects</p>
            <h2>Continue from previous architecture packs</h2>
          </div>

          {projects.length > 0 ? (
            <div className="mini-project-list">
              {projects.slice(0, 3).map((architecture) => (
                <ProjectCard
                  key={architecture.request_id}
                  architecture={architecture}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state subtle">
              <p>No saved projects yet.</p>
              <span>Your next generated architecture will appear here.</span>
            </div>
          )}

          {projects.length > 0 ? (
            <Link className="inline-link" to="/app/projects">
              View full library
            </Link>
          ) : null}
        </section>

        <section className="card panel">
          <div className="section-heading">
            <p className="eyebrow">Enterprise Checklist</p>
            <h2>What strong teams usually validate next</h2>
          </div>
          <div className="metric-grid">
            <article className="metric-card">
              <span>Platform controls</span>
              <strong>Identity, secrets, network, audit</strong>
            </article>
            <article className="metric-card">
              <span>Delivery readiness</span>
              <strong>IaC modules, environments, DR posture</strong>
            </article>
            <article className="metric-card">
              <span>Architecture review</span>
              <strong>Risks, tradeoffs, and next-step actions</strong>
            </article>
          </div>
        </section>
      </div>
    </div>
  );
}
