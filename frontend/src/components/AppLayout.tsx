import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useArchitectureStore } from "../context/ArchitectureStore";

const PAGE_TITLES: Array<{ prefix: string; title: string; subtitle: string }> = [
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
        <Link className="sidebar-brand" to="/">
          <span className="brand-mark">KA</span>
          <div>
            <strong>KasdevTech AI Architect</strong>
            <small>Enterprise Architecture SaaS</small>
          </div>
        </Link>

        <nav className="sidebar-nav">
          <NavLink
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
            to="/app/studio"
          >
            <span>New Architecture</span>
            <small>Create a fresh architecture brief</small>
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
            to="/app/projects"
          >
            <span>Projects</span>
            <small>Open saved architecture reports</small>
          </NavLink>
        </nav>

        <div className="sidebar-panel">
          <p className="eyebrow">Workspace</p>
          <h3>{projects.length}</h3>
          <p>Saved architecture packs available across your local workspace.</p>
        </div>

        <div className="sidebar-panel subtle-panel">
          <p className="eyebrow">Portfolio Signals</p>
          <ul className="mini-list">
            <li>{regulatedProjects} compliance-targeted projects</li>
            <li>{multiRegionProjects} multi-region designs</li>
            <li>{projects.filter((project) => project.iac_template).length} IaC-enabled packs</li>
          </ul>
        </div>

        <div className="sidebar-panel subtle-panel">
          <p className="eyebrow">Product Loop</p>
          <ul className="mini-list">
            <li>Brief the workload</li>
            <li>Generate architecture</li>
            <li>Review risks and controls</li>
            <li>Iterate toward delivery</li>
          </ul>
        </div>
      </aside>

      <div className="workspace-shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">Enterprise Workspace</p>
            <h1>{currentPage.title}</h1>
            <p className="topbar-copy">{currentPage.subtitle}</p>
          </div>

          <div className="topbar-actions">
            <Link className="button-link secondary" to="/app/projects">
              Open Library
            </Link>
            <Link className="button-link primary" to="/app/studio">
              New Architecture
            </Link>
          </div>
        </header>

        <main className="workspace-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
