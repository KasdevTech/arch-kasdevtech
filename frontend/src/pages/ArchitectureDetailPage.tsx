import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
  useParams,
} from "react-router-dom";
import type { ArchitectureResponse } from "../types";
import { useArchitectureStore } from "../context/ArchitectureStore";

export interface ProjectRouteContext {
  architecture: ArchitectureResponse;
  onDelete: () => void;
}

export function ArchitectureDetailPage() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { hydrated, projects, removeProject } = useArchitectureStore();

  const architecture = projects.find((item) => item.request_id === projectId);

  function handleDelete() {
    if (!architecture) {
      return;
    }

    removeProject(architecture.request_id);
    navigate("/app/projects");
  }

  if (!hydrated) {
    return (
      <section className="card empty-card">
        <p className="eyebrow">Loading</p>
        <h2>Loading architecture report...</h2>
      </section>
    );
  }

  if (!architecture) {
    return (
      <section className="card empty-card">
        <p className="eyebrow">Not Found</p>
        <h2>This architecture project does not exist in the local library.</h2>
        <p>
          It may have been deleted, or the workspace has not saved it yet.
        </p>
        <div className="action-row">
          <Link className="button-link secondary" to="/app/projects">
            Back to Library
          </Link>
          <Link className="button-link primary" to="/app/studio">
            Create New Architecture
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Project Report</p>
          <h2>{architecture.title}</h2>
          <p className="section-copy">
            Each project now has dedicated sub-pages for overview, architecture,
            and code so the experience feels like a real SaaS workspace.
          </p>
        </div>
        <div className="topbar-actions">
          <Link className="button-link secondary" to="/app/projects">
            Back to Library
          </Link>
          <Link
            className="button-link secondary"
            to={`/app/projects/${architecture.request_id}/edit`}
          >
            Edit Project
          </Link>
          <Link className="button-link primary" to="/app/studio">
            New Architecture
          </Link>
        </div>
      </section>

      <nav className="tab-nav">
        <NavLink
          className={({ isActive }) => (isActive ? "tab-link active" : "tab-link")}
          to="overview"
        >
          Overview
        </NavLink>
        <NavLink
          className={({ isActive }) => (isActive ? "tab-link active" : "tab-link")}
          to="architecture"
        >
          Architecture
        </NavLink>
        <NavLink
          className={({ isActive }) => (isActive ? "tab-link active" : "tab-link")}
          to="code"
        >
          Code
        </NavLink>
      </nav>

      <Outlet context={{ architecture, onDelete: handleDelete }} />
    </div>
  );
}
