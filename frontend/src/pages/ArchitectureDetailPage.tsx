import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import type { ArchitectureResponse } from "../types";
import { useArchitectureStore } from "../context/ArchitectureStore";
import { ProjectOverviewPage } from "./ProjectOverviewPage";
import { ProjectShipPage } from "./ProjectShipPage";
import { ProjectTerraformPage } from "./ProjectTerraformPage";

export interface ProjectRouteContext {
  architecture: ArchitectureResponse;
  onDelete: () => void;
}

export function ArchitectureDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { hydrated, projects, removeProject } = useArchitectureStore();

  const architecture = projects.find((item) => item.request_id === projectId);

  async function handleDelete() {
    if (!architecture) {
      return;
    }

    await removeProject(architecture.request_id);
    navigate("/app/projects");
  }

  if (!hydrated) {
    return (
      <section className="card empty-card">
        <p className="eyebrow">Loading</p>
        <h2>Loading project...</h2>
      </section>
    );
  }

  if (!architecture) {
    return (
      <section className="card empty-card">
        <p className="eyebrow">Not Found</p>
        <h2>This project does not exist in the local library.</h2>
        <div className="action-row">
          <Link className="button-link secondary" to="/app/projects">
            Back to Library
          </Link>
          <Link className="button-link primary" to="/app/studio">
            Create Project
          </Link>
        </div>
      </section>
    );
  }

  const currentSubpage = location.pathname.endsWith("/code")
    ? "code"
    : location.pathname.endsWith("/ship")
      ? "ship"
      : "arch";

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Project</p>
          <h2>{architecture.title}</h2>
          <p className="section-copy">
            Architect, review code, and prepare deployment from one project workspace.
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
            New Project
          </Link>
        </div>
      </section>

      <nav className="tab-nav">
        <NavLink
          className={({ isActive }) => (isActive ? "tab-link active" : "tab-link")}
          to={`/app/projects/${architecture.request_id}/arch`}
        >
          Arch
        </NavLink>
        <NavLink
          className={({ isActive }) => (isActive ? "tab-link active" : "tab-link")}
          to={`/app/projects/${architecture.request_id}/code`}
        >
          Code
        </NavLink>
        <NavLink
          className={({ isActive }) => (isActive ? "tab-link active" : "tab-link")}
          to={`/app/projects/${architecture.request_id}/ship`}
        >
          Ship
        </NavLink>
      </nav>
      {currentSubpage === "code" ? (
        <ProjectTerraformPage architecture={architecture} />
      ) : currentSubpage === "ship" ? (
        <ProjectShipPage architecture={architecture} />
      ) : (
        <ProjectOverviewPage
          architecture={architecture}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
