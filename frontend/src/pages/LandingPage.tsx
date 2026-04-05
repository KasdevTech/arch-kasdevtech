import { Link } from "react-router-dom";
import { ArchitectureBoard } from "../components/ArchitectureBoard";
import { ARCHITECTURE_TEMPLATES } from "../data/catalog";

const NAV_LINKS = ["Product", "Docs", "Blog", "Contact"];

const TRUST_POINTS = [
  "Azure",
  "AWS",
  "GCP",
  "Terraform",
  "Draw.io",
  "Chat Copilot",
];

const PLATFORM_PILLARS = [
  {
    title: "Generate",
    body: "Prompt to architecture",
  },
  {
    title: "Refine",
    body: "Review project and canvas",
  },
  {
    title: "Export",
    body: "Code and diagram outputs",
  },
];

export function LandingPage() {
  const heroTemplate = ARCHITECTURE_TEMPLATES[0];

  return (
    <div className="marketing-shell">
      <header className="marketing-nav">
        <Link className="marketing-brand" to="/">
          <span className="brand-mark">KA</span>
          <strong>KasdevTech AI Architect</strong>
        </Link>

        <nav className="marketing-links">
          {NAV_LINKS.map((link) => (
            <span key={link}>{link}</span>
          ))}
        </nav>

        <div className="marketing-actions">
          <Link className="button-link secondary" to="/app/projects">
            Sign in
          </Link>
          <Link className="button-link primary" to="/app/studio">
            Try for free
          </Link>
        </div>
      </header>

      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">Cloud Architecture Builder</p>
          <h1>Design and ship cloud architecture.</h1>
          <p className="hero-text">
            Create cloud architecture, refine the workspace, and move toward code-ready output in one product.
          </p>

          <div className="hero-actions">
            <Link className="button-link primary" to="/app/studio">
              Start for free
            </Link>
            <Link className="button-link secondary" to="/app/projects">
              Open workspace
            </Link>
          </div>

          <div className="trust-strip">
            {TRUST_POINTS.map((point) => (
              <span className="trust-chip" key={point}>
                {point}
              </span>
            ))}
          </div>
        </div>

        <div className="hero-preview">
          <article className="hero-panel card">
            <div className="hero-panel-head">
              <div>
                <p className="eyebrow">Featured Project</p>
                <h2>{heroTemplate?.title}</h2>
              </div>
              <span className="hero-status">Live preview</span>
            </div>
            <div className="pill-row">
              {heroTemplate?.tags.map((tag) => (
                <span className="priority-pill" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          </article>

          {heroTemplate ? (
            <ArchitectureBoard
              architecture={heroTemplate.preview}
              readOnly
              showLegend={false}
              showToolbar={false}
              showConnectionLabels={false}
            />
          ) : null}
        </div>
      </section>

      <section className="marketing-section">
        <div className="feature-grid">
          {PLATFORM_PILLARS.map((feature) => (
            <article key={feature.title} className="card marketing-card">
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="marketing-section compact-logo-strip">
        <div className="trust-strip muted">
          {TRUST_POINTS.map((point) => (
            <span className="trust-chip muted" key={`logo-${point}`}>
              {point}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
