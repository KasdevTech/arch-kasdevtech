import { Link } from "react-router-dom";
import { ArchitectureBoard } from "../components/ArchitectureBoard";
import { ProjectCard } from "../components/ProjectCard";
import { useArchitectureStore } from "../context/ArchitectureStore";
import { ARCHITECTURE_TEMPLATES } from "../data/catalog";

export function ProjectsPage() {
  const { hydrated, projects } = useArchitectureStore();

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Projects</p>
          <h2>Project library</h2>
        </div>
        <Link className="button-link primary" to="/app/studio">
          Create Project
        </Link>
      </section>

      {!hydrated ? (
        <section className="card empty-card">
          <h2>Loading projects...</h2>
        </section>
      ) : null}

      {hydrated && projects.length === 0 ? (
        <section className="card empty-card">
          <h2>No projects yet.</h2>
          <Link className="button-link primary" to="/app/studio">
            Create your first project
          </Link>
        </section>
      ) : null}

      {hydrated && projects.length === 0 ? (
        <section className="page-stack">
          <div className="compact-section-head">
            <div>
              <p className="eyebrow">Starter Gallery</p>
              <h2>Reference projects</h2>
            </div>
          </div>
          <div className="preview-grid">
            {ARCHITECTURE_TEMPLATES.slice(0, 2).map((template) => (
              <div className="page-stack" key={template.id}>
                <article className="card marketing-card">
                  <h3>{template.title}</h3>
                  <div className="pill-row">
                    {template.tags.map((tag) => (
                      <span className="priority-pill" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </article>
                <ArchitectureBoard
                  architecture={template.preview}
                  readOnly
                  showLegend={false}
                  showToolbar={false}
                  showConnectionLabels={false}
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {projects.length > 0 ? (
        <section className="projects-grid projects-grid-compact">
          {projects.map((architecture) => (
            <ProjectCard
              key={architecture.request_id}
              architecture={architecture}
            />
          ))}
        </section>
      ) : null}
    </div>
  );
}
