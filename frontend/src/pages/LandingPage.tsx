import { Link } from "react-router-dom";
import { ArchitectureBoard } from "../components/ArchitectureBoard";
import { ARCHITECTURE_TEMPLATES } from "../data/catalog";

const FEATURES = [
  {
    title: "Multi-page architecture workspace",
    body: "Move from marketing site to studio, from studio to projects library, and from project to a dedicated architecture report page.",
  },
  {
    title: "Enterprise workload intake",
    body: "Capture availability targets, compliance frameworks, tenancy, environments, DR posture, and network exposure before generating output.",
  },
  {
    title: "Architecture packs, not just diagrams",
    body: "Produce topology, controls, resilience notes, operating guidance, and Terraform starter content in one workflow.",
  },
];

const JOURNEY = [
  "Describe the product, workload, and constraints.",
  "Choose the cloud and enterprise posture.",
  "Generate a saved architecture project.",
  "Review the dedicated report page with controls, risks, and IaC starter output.",
];

const PRICING = [
  {
    name: "Starter",
    price: "Free",
    blurb: "Explore the workspace and generate a limited number of architecture packs.",
  },
  {
    name: "Pro",
    price: "₹999/mo",
    blurb: "For solo builders who need saved projects, richer exports, and repeated iterations.",
  },
  {
    name: "Team",
    price: "₹4999/mo",
    blurb: "For product and platform teams collaborating on architecture reviews and delivery planning.",
  },
];

export function LandingPage() {
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
          <p className="eyebrow">Enterprise SaaS Product</p>
          <h1>From product brief to cloud architecture, in a real workspace.</h1>
          <p className="hero-text">
            Turn your architecture generator into a SaaS-style experience with a
            landing page, creation studio, saved projects, and dedicated report
            pages for every architecture pack.
          </p>

          <div className="hero-actions">
            <Link className="button-link primary" to="/app/studio">
              Start a Project
            </Link>
            <Link className="button-link secondary" to="/app/projects">
              Browse Library
            </Link>
          </div>

          <div className="stats-row">
            <article className="stat-card">
              <strong>4</strong>
              <span>Core routes</span>
            </article>
            <article className="stat-card">
              <strong>1</strong>
              <span>Saved project per architecture</span>
            </article>
            <article className="stat-card">
              <strong>∞</strong>
              <span>Iteration cycles</span>
            </article>
          </div>
        </div>

        <div className="hero-panel card">
          <p className="eyebrow">Product Flow</p>
          <h2>Landing → Studio → Projects → Report</h2>
          <ul className="mini-list">
            <li>Marketing homepage for the product</li>
            <li>Dedicated generator workspace</li>
            <li>Projects library with saved architecture packs</li>
            <li>One detail page per generated project</li>
          </ul>
        </div>
      </section>

      <section className="marketing-section">
        <div className="section-heading">
          <p className="eyebrow">Reference Blueprints</p>
          <h2>Show enterprise users what “good” looks like</h2>
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
          <p className="eyebrow">Why This Feels Like SaaS</p>
          <h2>Product surfaces instead of one long page</h2>
        </div>

        <div className="feature-grid">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="card marketing-card">
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="marketing-section">
        <div className="section-heading">
          <p className="eyebrow">Journey</p>
          <h2>How a team would use the product</h2>
        </div>

        <div className="journey-grid">
          {JOURNEY.map((step, index) => (
            <article key={step} className="card marketing-card journey-card">
              <span className="step-badge">0{index + 1}</span>
              <p>{step}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="marketing-section">
        <div className="section-heading">
          <p className="eyebrow">Pricing</p>
          <h2>Position it like a real product</h2>
        </div>

        <div className="pricing-grid">
          {PRICING.map((plan) => (
            <article key={plan.name} className="card marketing-card pricing-card">
              <p className="eyebrow">{plan.name}</p>
              <h3>{plan.price}</h3>
              <p>{plan.blurb}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
