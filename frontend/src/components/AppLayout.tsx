import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useArchitectureStore } from "../context/ArchitectureStore";

const PAGE_TITLES: Array<{ prefix: string; title: string; subtitle: string }> = [
  {
    prefix: "/app/chat",
    title: "Architect Chat",
    subtitle: "Refine the problem conversationally and generate architecture directly from the dialogue.",
  },
  {
    prefix: "/app/studio",
    title: "Architecture Studio",
    subtitle: "Capture workload intent and generate enterprise architecture deliverables.",
  },
  {
    prefix: "/app/projects/",
    title: "Project Workspace",
    subtitle: "Review architecture packs, refine the canvas, and hand off implementation-ready exports.",
  },
  {
    prefix: "/app/projects",
    title: "Projects Library",
    subtitle: "Browse saved architectures, reopen reports, and continue product planning.",
  },
];

export function AppLayout() {
  const location = useLocation();
  const { projects } = useArchitectureStore();
  const regulatedProjects = projects.filter(
    (project) => project.preferences.compliance_frameworks.length > 0,
  ).length;
  const multiRegionProjects = projects.filter(
    (project) => project.preferences.multi_region,
  ).length;

  const currentPage =
    PAGE_TITLES.find((item) => location.pathname.startsWith(item.prefix)) ??
    PAGE_TITLES[0];

  return (
    <div className="product-shell">
      <aside className="sidebar">
        <div className="sidebar-stack">
          <Link className="sidebar-brand" to="/">
            <span className="brand-mark">KA</span>
            <div>
              <strong>KasdevTech AI Architect</strong>
              <small>Enterprise Architecture Platform</small>
            </div>
          </Link>

          <div className="sidebar-summary">
            <span className="sidebar-badge">Workspace active</span>
            <h2>Design cloud systems with a cleaner operating flow.</h2>
            <p>
              Move from brief to architecture, then into implementation-ready
              outputs without losing the context of the workload.
            </p>
          </div>

          <nav className="sidebar-nav">
            <NavLink
              className={({ isActive }) =>
                isActive ? "sidebar-link active" : "sidebar-link"
              }
              to="/app/chat"
            >
              <span>Architect Chat</span>
              <small>Turn conversation into architecture</small>
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                isActive ? "sidebar-link active" : "sidebar-link"
              }
              to="/app/studio"
            >
              <span>Architecture Studio</span>
              <small>Create or edit a workload brief</small>
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                isActive ? "sidebar-link active" : "sidebar-link"
              }
              to="/app/projects"
            >
              <span>Projects Library</span>
              <small>Reopen saved workspaces and reports</small>
            </NavLink>
          </nav>

          <div className="sidebar-metrics">
            <article className="sidebar-panel">
              <p className="eyebrow">Projects</p>
              <h3>{projects.length}</h3>
              <p>Saved architecture workspaces in your current environment.</p>
            </article>
            <article className="sidebar-panel subtle-panel">
              <p className="eyebrow">Regulated</p>
              <h3>{regulatedProjects}</h3>
              <p>Projects carrying one or more compliance frameworks.</p>
            </article>
            <article className="sidebar-panel subtle-panel">
              <p className="eyebrow">Multi-region</p>
              <h3>{multiRegionProjects}</h3>
              <p>Architectures designed with broader resilience posture.</p>
            </article>
          </div>

          <div className="sidebar-panel subtle-panel">
            <p className="eyebrow">Coverage</p>
            <ul className="mini-list">
              <li>Dedicated overview, architecture, and code pages</li>
              <li>{projects.filter((project) => project.iac_template).length} IaC-enabled packs</li>
              <li>Editable architecture canvas and export flow</li>
            </ul>
          </div>
        </div>
      </aside>

      <div className="workspace-shell">
        <header className="topbar">
          <div className="topbar-copy-block">
            <p className="eyebrow">Enterprise Workspace</p>
            <h1>{currentPage.title}</h1>
            <p className="topbar-copy">{currentPage.subtitle}</p>
          </div>

          <div className="topbar-right">
            <div className="topbar-signals">
              <span className="trust-chip">Local workspace</span>
              <span className="trust-chip">{projects.length} saved projects</span>
              <span className="trust-chip">
                {projects.filter((project) => project.iac_template).length} code-ready
              </span>
            </div>

            <div className="topbar-actions">
              <Link className="button-link secondary" to="/app/projects">
                Open Library
              </Link>
              <Link className="button-link secondary" to="/app/chat">
                Open Chat
              </Link>
              <Link className="button-link primary" to="/app/studio">
                New Architecture
              </Link>
            </div>
          </div>
        </header>

        <main className="workspace-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
