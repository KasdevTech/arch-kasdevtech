import { Link } from "react-router-dom";
import { ArchitectureBoard } from "../components/ArchitectureBoard";
import { ARCHITECTURE_TEMPLATES } from "../data/catalog";

const TRUST_POINTS = [
  "Azure, AWS, and GCP mapping",
  "Architecture canvas and exports",
  "Terraform starter outputs",
  "Security-aware workload intake",
];

const PLATFORM_PILLARS = [
  {
    title: "Generate",
    body: "Convert a workload brief into an enterprise-ready architecture pack with mapped services, controls, and rationale.",
  },
  {
    title: "Refine",
    body: "Open every project in its own workspace, adjust the architecture canvas, and iterate without losing the original brief.",
  },
  {
    title: "Export",
    body: "Move from design to delivery with dedicated architecture and code pages, plus downloadable engineering artifacts.",
  },
];

const ENTERPRISE_CAPABILITIES = [
  "Dedicated overview, architecture, and code pages for every generated project.",
  "Workload intake for environments, tenancy, DR posture, sensitivity, and compliance.",
  "Sample blueprints that show teams what a finished architecture pack looks like.",
  "Visual canvas with cloud-service imagery and exports for downstream reviews.",
];

const OPERATING_MODEL = [
  {
    name: "01",
    title: "Capture the workload",
    blurb:
      "Start with a product brief, choose your cloud, and describe the enterprise posture the system must satisfy.",
  },
  {
    name: "02",
    title: "Generate the architecture pack",
    blurb:
      "Map the workload into cloud services, controls, and delivery-oriented structure instead of a generic one-off diagram.",
  },
  {
    name: "03",
    title: "Hand off with confidence",
    blurb:
      "Review the architecture page, move into code artifacts, and export outputs for implementation or architecture review.",
  },
];

export function LandingPage() {
  const heroTemplate = ARCHITECTURE_TEMPLATES[0];
  const featuredTemplates = ARCHITECTURE_TEMPLATES.slice(0, 2);

  return (
    <div className="marketing-shell">
      <header className="marketing-nav">
        <Link className="marketing-brand" to="/">
          <span className="brand-mark">KA</span>
          <strong>KasdevTech AI Architect</strong>
        </Link>

        <div className="marketing-actions">
          <Link className="button-link secondary" to="/app/projects">
            View Projects
          </Link>
          <Link className="button-link primary" to="/app/studio">
            Open Studio
          </Link>
        </div>
      </header>

      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">Enterprise Architecture Platform</p>
          <h1>Turn a product brief into a cloud architecture your team can actually use.</h1>
          <p className="hero-text">
            KasdevTech AI Architect is a multi-page SaaS workspace for
            generating architecture diagrams, controls, implementation guidance,
            and starter code artifacts across Azure, AWS, and GCP.
          </p>

          <div className="hero-actions">
            <Link className="button-link primary" to="/app/studio">
              Start Architecture
            </Link>
            <Link className="button-link secondary" to="/app/projects">
              View Projects
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
                <p className="eyebrow">Featured Blueprint</p>
                <h2>{heroTemplate?.title}</h2>
              </div>
              <span className="hero-status">Workspace ready</span>
            </div>
            <p className="section-copy">
              {heroTemplate?.description}
            </p>
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
        <div className="section-heading">
          <p className="eyebrow">Platform</p>
          <h2>Built like a real product, not a one-screen generator</h2>
        </div>

        <div className="feature-grid">
          {PLATFORM_PILLARS.map((feature) => (
            <article key={feature.title} className="card marketing-card">
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="marketing-section">
        <div className="section-heading">
          <p className="eyebrow">Reference Blueprints</p>
          <h2>Show enterprise buyers the finished experience up front</h2>
        </div>

        <div className="preview-grid">
          {featuredTemplates.map((template) => (
            <div className="page-stack" key={template.id}>
              <article className="card marketing-card">
                <p className="eyebrow">Sample Pack</p>
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

      <section className="marketing-section">
        <div className="section-heading">
          <p className="eyebrow">Capabilities</p>
          <h2>What enterprise users expect before they trust the output</h2>
        </div>

        <div className="journey-grid">
          {ENTERPRISE_CAPABILITIES.map((item, index) => (
            <article key={item} className="card marketing-card journey-card">
              <span className="step-badge">0{index + 1}</span>
              <p>{item}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="marketing-section">
        <div className="section-heading">
          <p className="eyebrow">Workflow</p>
          <h2>Designed for architecture review, not just generation</h2>
        </div>

        <div className="pricing-grid">
          {OPERATING_MODEL.map((item) => (
            <article key={item.name} className="card marketing-card pricing-card">
              <p className="eyebrow">{item.name}</p>
              <h3>{item.title}</h3>
              <p>{item.blurb}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
