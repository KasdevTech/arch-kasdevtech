import { Link } from "react-router-dom";
import { ArchitectureBoard } from "../components/ArchitectureBoard";
import { ProjectCard } from "../components/ProjectCard";
import { useArchitectureStore } from "../context/ArchitectureStore";
import { ARCHITECTURE_TEMPLATES } from "../data/catalog";

export function ProjectsPage() {
  const { hydrated, projects } = useArchitectureStore();

  const totalProjects = projects.length;
  const multiRegionProjects = projects.filter(
    (project) => project.preferences.multi_region,
  ).length;
  const regulatedProjects = projects.filter(
    (project) => project.preferences.compliance_frameworks.length > 0,
  ).length;
  const iacReadyProjects = projects.filter((project) => project.iac_template).length;

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Projects</p>
          <h2>Saved architecture packs</h2>
          <p className="section-copy">
            Each generated architecture now has its own detail page, so the
            library behaves like a real product workspace instead of a single
            long response page.
          </p>
        </div>
        <Link className="button-link primary" to="/app/studio">
          Create New Project
        </Link>
      </section>

      <section className="metric-grid">
        <article className="card metric-card">
          <span>Total projects</span>
          <strong>{totalProjects}</strong>
        </article>
        <article className="card metric-card">
          <span>Multi-region designs</span>
          <strong>{multiRegionProjects}</strong>
        </article>
        <article className="card metric-card">
          <span>Compliance-targeted</span>
          <strong>{regulatedProjects}</strong>
        </article>
        <article className="card metric-card">
          <span>IaC-ready packs</span>
          <strong>{iacReadyProjects}</strong>
        </article>
      </section>

      {!hydrated ? (
        <section className="card empty-card">
          <p className="eyebrow">Loading</p>
          <h2>Loading project library...</h2>
        </section>
      ) : null}

      {hydrated && projects.length === 0 ? (
        <section className="card empty-card">
          <p className="eyebrow">Empty</p>
          <h2>No architecture packs saved yet.</h2>
          <p>
            Generate your first project from the studio and it will appear here
            with its own dedicated detail page.
          </p>
          <Link className="button-link primary" to="/app/studio">
            Go to Studio
          </Link>
        </section>
      ) : null}

      {hydrated && projects.length === 0 ? (
        <section className="page-stack">
          <div className="section-heading">
            <p className="eyebrow">Starter Gallery</p>
            <h2>Reference packs for first-time enterprise users</h2>
          </div>
          <div className="preview-grid">
            {ARCHITECTURE_TEMPLATES.slice(0, 2).map((template) => (
              <div className="page-stack" key={template.id}>
                <article className="card marketing-card">
                  <h3>{template.title}</h3>
                  <p>{template.description}</p>
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
        <section className="projects-grid">
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
