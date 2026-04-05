import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useArchitectureStore } from "../context/ArchitectureStore";
import { useTheme } from "../context/ThemeContext";

const NAV_ITEMS = [
  { to: "/app/studio", label: "Create Project" },
  { to: "/app/projects", label: "Projects" },
] as const;

const PAGE_TITLES: Array<{ prefix: string; title: string; subtitle: string }> = [
  {
    prefix: "/app/studio",
    title: "Create Project",
    subtitle: "Shape a cloud architecture project.",
  },
  {
    prefix: "/app/projects/",
    title: "Project",
    subtitle: "Review architecture and exports.",
  },
  {
    prefix: "/app/projects",
    title: "Projects",
    subtitle: "Browse saved work.",
  },
];

export function AppLayout() {
  const location = useLocation();
  const { projects } = useArchitectureStore();
  const { theme, toggleTheme } = useTheme();
  const codeReadyProjects = projects.filter((project) => project.iac_template).length;
  const initials = "KS";
  const projectMatch = location.pathname.match(/^\/app\/projects\/([^/]+)/);
  const activeProjectId = projectMatch?.[1];
  const activeProject = activeProjectId
    ? projects.find((project) => project.request_id === activeProjectId)
    : undefined;

  const currentPage =
    PAGE_TITLES.find((item) => location.pathname.startsWith(item.prefix)) ??
    PAGE_TITLES[0];

  return (
    <div className="product-shell">
      <aside className="sidebar sidebar-rail">
        <Link className="sidebar-brand sidebar-brand-compact" to="/">
          <span className="brand-mark">KA</span>
          <strong>KasdevTech</strong>
        </Link>

        <nav className="sidebar-text-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              aria-label={item.label}
              key={item.to}
              className={({ isActive }) =>
                isActive ? "sidebar-text-link active" : "sidebar-text-link"
              }
              to={item.to}
            >
              <span className="sidebar-link-icon" />
              <span className="sidebar-link-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-section">
          <p className="sidebar-section-label">Workspace</p>
          <div className="sidebar-rail-footer">
            <span className="sidebar-mini-chip">{projects.length} projects</span>
            <span className="sidebar-mini-chip">{codeReadyProjects} code-ready</span>
          </div>
        </div>

        <div className="sidebar-project-section">
          <div className="project-rail-card">
            <p className="sidebar-section-label">Project</p>
            <strong>{activeProject ? activeProject.title : "Select a project"}</strong>
            {activeProject ? (
              <nav className="project-rail-nav">
                <NavLink
                  className={({ isActive }) =>
                    isActive ? "project-rail-link active" : "project-rail-link"
                  }
                  to={`/app/projects/${activeProject.request_id}/arch`}
                >
                  Arch
                </NavLink>
                <NavLink
                  className={({ isActive }) =>
                    isActive ? "project-rail-link active" : "project-rail-link"
                  }
                  to={`/app/projects/${activeProject.request_id}/code`}
                >
                  Code
                </NavLink>
                <NavLink
                  className={({ isActive }) =>
                    isActive ? "project-rail-link active" : "project-rail-link"
                  }
                  to={`/app/projects/${activeProject.request_id}/ship`}
                >
                  Ship
                </NavLink>
              </nav>
            ) : (
              <p className="project-rail-empty">Open a project to switch between architecture, code, and deployment.</p>
            )}
          </div>
        </div>
      </aside>

      <div className="workspace-shell">
        <header className="topbar">
          <div className="topbar-copy-block">
            <div className="workspace-breadcrumbs">
              <Link to="/app/projects">Organization</Link>
              <span>/</span>
              <span>{currentPage.title}</span>
            </div>
            <h1>{currentPage.title}</h1>
            <p className="topbar-copy minimal">{currentPage.subtitle}</p>
          </div>

          <div className="topbar-right">
            <div className="topbar-actions topbar-utility">
              <button
                className="shell-icon-button"
                type="button"
                aria-label="Toggle theme"
                onClick={toggleTheme}
                title={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
              >
                {theme === "light" ? "☾" : "☼"}
              </button>
              <span className="workspace-avatar">{initials}</span>
              <Link className="button-link primary" to="/app/studio">
                Create Project
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
