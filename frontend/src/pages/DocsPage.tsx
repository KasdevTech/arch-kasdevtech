import { Link } from "react-router-dom";

const DOC_SECTIONS = [
  {
    title: "Architecture workflow",
    body: "Create in Studio, refine in Arch, inspect infrastructure in Code, and validate deployment in Ship.",
  },
  {
    title: "Copilot behavior",
    body: "Use the floating Architecture Copilot to ask questions, compare services, or generate architectures from chat.",
  },
  {
    title: "Deploy flow",
    body: "Ship now prepares a real deploy inventory and uses Terraform-first deployment for the supported Azure resource set.",
  },
];

export function DocsPage() {
  return (
    <div className="marketing-shell">
      <header className="marketing-nav">
        <Link className="marketing-brand" to="/">
          <span className="brand-mark">KA</span>
          <strong>KasdevTech AI Architect</strong>
        </Link>
        <div className="marketing-actions">
          <Link className="button-link secondary" to="/">
            Back home
          </Link>
          <Link className="button-link primary" to="/app/studio">
            Open Studio
          </Link>
        </div>
      </header>

      <section className="hero-section content-hero">
        <div className="hero-copy">
          <p className="eyebrow">Docs</p>
          <h1>Product docs and platform guide.</h1>
          <p className="hero-text">
            Start here for the live product flow, architecture workspace, code generation, and Azure Ship process.
          </p>
        </div>
      </section>

      <section className="marketing-section">
        <div className="feature-grid">
          {DOC_SECTIONS.map((section) => (
            <article className="card marketing-card" key={section.title}>
              <h3>{section.title}</h3>
              <p>{section.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="marketing-section">
        <article className="card marketing-card">
          <h3>Technical docs in repo</h3>
          <p>
            Deep technical walkthroughs live in the repository under `docs/`, including code explanation and the
            enterprise accuracy roadmap.
          </p>
          <div className="hero-actions">
            <a
              className="button-link secondary"
              href="https://github.com/KasdevTech/arch-kasdevtech/tree/main/docs"
              rel="noreferrer"
              target="_blank"
            >
              Open GitHub docs
            </a>
            <a className="button-link primary" href="http://127.0.0.1:8000/docs" rel="noreferrer" target="_blank">
              Open API docs
            </a>
          </div>
        </article>
      </section>
    </div>
  );
}
