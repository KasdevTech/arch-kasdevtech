import { startTransition, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { generateArchitecture } from "../api";
import { ArchitectureBoard } from "../components/ArchitectureBoard";
import { ArchitectureComposer } from "../components/ArchitectureComposer";
import { HardLink } from "../components/HardLink";
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
      const nextTitle =
        payload.preferences.workload_name?.trim() || response.title;
      const persistedProject: ArchitectureResponse = editingProject
        ? {
            ...response,
            title: nextTitle,
            request_id: editingProject.request_id,
            source_request: payload,
          }
        : {
            ...response,
            title: nextTitle,
            source_request: payload,
          };
      const savedProject = await saveProject(
        persistedProject,
        editingProject ? "Updated project intake" : "Created project",
      );
      startTransition(() => undefined);
      navigate(
        `/app/projects/${savedProject.request_id}/arch`,
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
      <section className="card panel studio-panel">
        <div className="studio-stepper">
          <div className="studio-step active">
            <span>01</span>
            <strong>Project</strong>
          </div>
          <div className="studio-step-divider" />
          <div className="studio-step">
            <span>02</span>
            <strong>Cloud</strong>
          </div>
          <div className="studio-step-divider" />
          <div className="studio-step">
            <span>03</span>
            <strong>Generate</strong>
          </div>
        </div>

        <div className="studio-panel-body">
          <ArchitectureComposer
            error={error}
            initialRequest={initialRequest}
            loading={loading}
            mode={editingProject ? "edit" : "create"}
            onGenerate={handleGenerate}
            presetRequest={editingProject ? undefined : selectedTemplate?.request}
          />
        </div>
      </section>

      <div className="page-stack">
        <section className="card panel">
          <div className="compact-section-head">
            <div>
              <p className="eyebrow">Project</p>
              <h2>{editingProject ? `Editing ${editingProject.title}` : "Set up project profile"}</h2>
            </div>
          </div>
          <div className="studio-helper-stack compact">
            <article className="studio-helper-card">
              <strong>Name</strong>
              <p>Use a clear project name.</p>
            </article>
            <article className="studio-helper-card">
              <strong>Cloud</strong>
              <p>Choose the target platform.</p>
            </article>
            <article className="studio-helper-card">
              <strong>Brief</strong>
              <p>Describe core components, scale, and constraints.</p>
            </article>
          </div>
          {editingProject ? (
            <div className="action-row">
              <HardLink
                className="button-link secondary"
                to={`/app/projects/${editingProject.request_id}/arch`}
              >
                Cancel editing
              </HardLink>
            </div>
          ) : null}
        </section>

        {!editingProject ? (
          <section className="card panel">
            <div className="compact-section-head">
              <div>
                <p className="eyebrow">Template</p>
                <h2>Starter patterns</h2>
              </div>
            </div>

            <div className="template-grid compact">
              {ARCHITECTURE_TEMPLATES.slice(0, 3).map((template) => (
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
                      <h3>{template.title}</h3>
                    </div>
                    <button
                      className="secondary-button"
                      onClick={() => setSelectedTemplateId(template.id)}
                      type="button"
                    >
                      Select
                    </button>
                  </div>
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
          <div className="compact-section-head">
            <div>
              <p className="eyebrow">Recent</p>
              <h2>Library</h2>
            </div>
            {projects.length > 0 ? (
              <HardLink className="inline-link" to="/app/projects">
                View all
              </HardLink>
            ) : null}
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
              <span>Your next project will appear here.</span>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
