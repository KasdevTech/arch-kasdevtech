import { Link } from "react-router-dom";

const POSTS = [
  {
    title: "How we built a universal cloud solution architect",
    excerpt: "The architecture engine now blends heuristic routing, lightweight classifiers, pattern ranking, and LLM assistance.",
  },
  {
    title: "Why Arch, Code, and Ship must share the same source of truth",
    excerpt: "We moved Ship back to a Terraform-first flow so generated code and deployment stay aligned.",
  },
  {
    title: "What enterprise users actually need from AI architecture tools",
    excerpt: "Version history, deployment planning, validation, and clear service reasoning matter more than flashy diagrams alone.",
  },
];

export function BlogPage() {
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
          <Link className="button-link primary" to="/app/projects">
            Open workspace
          </Link>
        </div>
      </header>

      <section className="hero-section content-hero">
        <div className="hero-copy">
          <p className="eyebrow">Blog</p>
          <h1>Build notes, product thinking, and architecture ideas.</h1>
          <p className="hero-text">
            A lightweight product blog for architecture decisions, SaaS evolution, and enterprise roadmap updates.
          </p>
        </div>
      </section>

      <section className="marketing-section">
        <div className="page-stack">
          {POSTS.map((post) => (
            <article className="card marketing-card" key={post.title}>
              <p className="eyebrow">Product note</p>
              <h3>{post.title}</h3>
              <p>{post.excerpt}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
