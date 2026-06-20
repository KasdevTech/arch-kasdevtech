import { Outlet, useLocation } from "react-router-dom";
import { HardLink } from "./HardLink";
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
    subtitle: "Define the workload and generate a deployable workspace.",
  },
  {
    prefix: "/app/projects",
    title: "Projects",
    subtitle: "Saved architecture workspaces.",
  },
  {
    prefix: "/app/chat",
    title: "Architecture Copilot",
    subtitle: "Chat, refine, and generate from one copilot thread.",
  },
];

export function AppLayout() {
  const location = useLocation();
  const { projects, workspaceSummary } = useArchitectureStore();
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
  const currentSection = location.pathname.endsWith("/code")
    ? "Code"
    : location.pathname.endsWith("/ship")
      ? "Ship"
      : location.pathname.includes("/app/projects/")
        ? "Arch"
        : currentPage.title;

  function isActivePath(target: string) {
    return location.pathname === target || location.pathname.startsWith(`${target}/`);
  }

  return (
    <div className="product-shell">
      <aside className="sidebar sidebar-rail">
        <HardLink className="sidebar-brand sidebar-brand-compact" to="/">
          <span className="brand-mark">KA</span>
          <strong>KasdevTech</strong>
        </HardLink>

        <nav className="sidebar-text-nav">
          {NAV_ITEMS.map((item) => (
            <HardLink
              aria-label={item.label}
              key={item.to}
              className={
                isActivePath(item.to) ? "sidebar-text-link active" : "sidebar-text-link"
              }
              to={item.to}
            >
              <span className="sidebar-link-icon" />
              <span className="sidebar-link-label">{item.label}</span>
            </HardLink>
          ))}
        </nav>

        <div className="sidebar-section">
          <p className="sidebar-section-label">Workspace</p>
          <div className="sidebar-rail-footer">
            <span className="sidebar-mini-chip">
              {workspaceSummary?.total_projects ?? projects.length} projects
            </span>
            <span className="sidebar-mini-chip">
              {workspaceSummary?.code_ready_projects ?? codeReadyProjects} code-ready
            </span>
          </div>
        </div>

        {workspaceSummary?.recent_projects?.length ? (
          <div className="sidebar-section">
            <p className="sidebar-section-label">Recent</p>
            <div className="sidebar-project-list">
              {workspaceSummary.recent_projects.slice(0, 4).map((project) => (
                <HardLink
                  key={`recent-${project.request_id}`}
                  className={
                    project.request_id === activeProjectId
                      ? "sidebar-project-link active"
                      : "sidebar-project-link"
                  }
                  to={`/app/projects/${project.request_id}/arch`}
                >
                  <strong>{project.title}</strong>
                  <span>{project.cloud.toUpperCase()}</span>
                </HardLink>
              ))}
            </div>
          </div>
        ) : null}

        <div className="sidebar-project-section">
          <div className="project-rail-card">
            <p className="sidebar-section-label">Project</p>
            <strong>{activeProject ? activeProject.title : "Select a project"}</strong>
            {activeProject ? (
              <nav className="project-rail-nav">
                <HardLink
                  className={
                    location.pathname === `/app/projects/${activeProject.request_id}/arch`
                      ? "project-rail-link active"
                      : "project-rail-link"
                  }
                  to={`/app/projects/${activeProject.request_id}/arch`}
                >
                  Arch
                </HardLink>
                <HardLink
                  className={
                    location.pathname === `/app/projects/${activeProject.request_id}/code`
                      ? "project-rail-link active"
                      : "project-rail-link"
                  }
                  to={`/app/projects/${activeProject.request_id}/code`}
                >
                  Code
                </HardLink>
                <HardLink
                  className={
                    location.pathname === `/app/projects/${activeProject.request_id}/ship`
                      ? "project-rail-link active"
                      : "project-rail-link"
                  }
                  to={`/app/projects/${activeProject.request_id}/ship`}
                >
                  Ship
                </HardLink>
              </nav>
            ) : (
              <p className="project-rail-empty">Open a project to work in Arch, Code, and Ship.</p>
            )}
          </div>
        </div>
      </aside>

      <div className="workspace-shell">
        <header className="topbar">
          <div className="topbar-copy-block">
            <div className="workspace-breadcrumbs">
              <HardLink to="/app/projects">Organization</HardLink>
              <span>/</span>
              <span>{activeProject ? activeProject.title : currentPage.title}</span>
              {activeProject ? (
                <>
                  <span>/</span>
                  <span>{currentSection}</span>
                </>
              ) : null}
            </div>
            <h1>{activeProject ? activeProject.title : currentPage.title}</h1>
            <p className="topbar-copy minimal">
              {activeProject
                ? `${currentSection} workspace`
                : currentPage.subtitle}
            </p>
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
              <HardLink className="button-link primary" to="/app/studio">
                Create Project
              </HardLink>
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
