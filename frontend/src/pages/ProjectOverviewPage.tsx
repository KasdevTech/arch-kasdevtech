import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { rebuildArchitecture } from "../api";
import { ArchitectureBoard } from "../components/ArchitectureBoard";
import { ArchitectureReport } from "../components/ArchitectureReport";
import { HardLink } from "../components/HardLink";
import { useArchitectureStore } from "../context/ArchitectureStore";
import type { Connection, ProjectHistoryResponse, ServiceMapping } from "../types";
import type { ProjectRouteContext } from "./ArchitectureDetailPage";

interface ProjectOverviewPageProps {
  architecture?: ProjectRouteContext["architecture"];
  onDelete?: ProjectRouteContext["onDelete"];
}

export function ProjectOverviewPage(props: ProjectOverviewPageProps = {}) {
  const routeContext = useOutletContext<ProjectRouteContext | undefined>();
  const architecture = props.architecture ?? routeContext?.architecture;
  const onDelete = props.onDelete ?? routeContext?.onDelete;

  if (!architecture) {
    return null;
  }
  const project = architecture;
  const { saveProject, updateCanvasLayout, loadProjectHistory, restoreProject } =
    useArchitectureStore();
  const [services, setServices] = useState<ServiceMapping[]>(project.services);
  const [connections, setConnections] = useState<Connection[]>(project.connections);
  const [history, setHistory] = useState<ProjectHistoryResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setServices(project.services);
  }, [project]);

  useEffect(() => {
    setConnections(project.connections);
  }, [project]);

  useEffect(() => {
    let active = true;
    async function hydrateHistory() {
      try {
        const response = await loadProjectHistory(project.request_id);
        if (active) {
          setHistory(response);
        }
      } catch {
        if (active) {
          setHistory(null);
        }
      }
    }
    void hydrateHistory();
    return () => {
      active = false;
    };
  }, [project.request_id]);

  async function handleRegenerate() {
    setSaving(true);
    setError("");
    try {
      const rebuilt = await rebuildArchitecture({
        ...architecture,
        ...project,
        services,
        connections,
      });
      await saveProject({
        ...rebuilt,
        source_request: project.source_request,
        canvas_layout: project.canvas_layout,
        azure_deployment_profile: project.azure_deployment_profile,
        deployment_run: project.deployment_run,
      }, "Regenerated architecture from edited canvas");
      setHistory(await loadProjectHistory(project.request_id));
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to regenerate architecture right now.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleRestore(versionId: string) {
    setRestoringVersionId(versionId);
    setError("");
    try {
      await restoreProject(project.request_id, versionId);
      setHistory(await loadProjectHistory(project.request_id));
    } catch (restoreError) {
      setError(
        restoreError instanceof Error
          ? restoreError.message
          : "Unable to restore version right now.",
      );
    } finally {
      setRestoringVersionId(null);
    }
  }

  return (
    <div className="page-stack">
      <section className="workspace-hero-grid">
        <article className="card workspace-hero-card">
          <p className="eyebrow">Architecture</p>
          <h3>{project.title}</h3>
          <p className="project-summary compact">{project.summary}</p>
          <div className="pill-row">
            {project.priorities.slice(0, 4).map((priority) => (
              <span className="priority-pill" key={priority}>
                {priority.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </article>
        <article className="card workspace-hero-card">
          <p className="eyebrow">Actions</p>
          <div className="workspace-jump-grid">
            <HardLink className="workspace-jump-card" to={`/app/projects/${project.request_id}/code`}>
              <strong>Code</strong>
              <span>Open Terraform output</span>
            </HardLink>
            <HardLink className="workspace-jump-card" to={`/app/projects/${project.request_id}/ship`}>
              <strong>Ship</strong>
              <span>Prepare and deploy</span>
            </HardLink>
          </div>
        </article>
      </section>

      <ArchitectureBoard
        architecture={project}
        services={services}
        connections={connections}
        onConnectionsChange={setConnections}
        onLayoutChange={(layout) =>
          updateCanvasLayout(project.request_id, layout)
        }
        onServicesChange={setServices}
      />

      <section className="card panel">
        <div className="compact-section-head">
          <div>
            <p className="eyebrow">Sync</p>
            <h2>Regenerate project outputs</h2>
          </div>
          <div className="action-row">
            <button
              className="primary-button"
              disabled={saving}
              onClick={handleRegenerate}
              type="button"
            >
              {saving ? "Regenerating..." : "Regenerate Arch + Code"}
            </button>
          </div>
        </div>

        {error ? <p className="error-banner">{error}</p> : null}
        <p className="section-copy">
          Edit the canvas, then rebuild to refresh the architecture, generated Terraform, and ship plan.
        </p>
      </section>

      <ArchitectureReport
        architecture={project}
        history={history}
        onDelete={onDelete}
        onRestoreVersion={handleRestore}
        restoringVersionId={restoringVersionId}
      />
    </div>
  );
}
