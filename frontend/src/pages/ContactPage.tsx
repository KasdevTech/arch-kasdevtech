import { Link } from "react-router-dom";

const CONTACT_OPTIONS = [
  {
    title: "Product walkthrough",
    body: "Request a walkthrough of the architecture workspace, copilot, and Azure Ship flow.",
    actionLabel: "Email KasdevTech",
    href: "mailto:hello@kasdevtech.com?subject=KasdevTech%20AI%20Architect%20walkthrough",
  },
  {
    title: "Enterprise inquiry",
    body: "Discuss organization workspaces, deployment controls, and roadmap requirements for your team.",
    actionLabel: "Start conversation",
    href: "mailto:hello@kasdevtech.com?subject=KasdevTech%20AI%20Architect%20enterprise%20inquiry",
  },
];

export function ContactPage() {
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
            Try product
          </Link>
        </div>
      </header>

      <section className="hero-section content-hero">
        <div className="hero-copy">
          <p className="eyebrow">Contact</p>
          <h1>Talk to KasdevTech.</h1>
          <p className="hero-text">
            Reach out for product walkthroughs, enterprise conversations, or architecture-tool partnerships.
          </p>
        </div>
      </section>

      <section className="marketing-section">
        <div className="feature-grid">
          {CONTACT_OPTIONS.map((option) => (
            <article className="card marketing-card" key={option.title}>
              <h3>{option.title}</h3>
              <p>{option.body}</p>
              <a className="button-link secondary" href={option.href}>
                {option.actionLabel}
              </a>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
