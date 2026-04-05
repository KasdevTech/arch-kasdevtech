import { useEffect, useState } from "react";
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
  if (!props.architecture) {
    return null;
  }
  const architecture = props.architecture;
  const onDelete = props.onDelete;
  const { saveProject, updateCanvasLayout, loadProjectHistory, restoreProject } =
    useArchitectureStore();
  const [services, setServices] = useState<ServiceMapping[]>(architecture.services);
  const [connections, setConnections] = useState<Connection[]>(architecture.connections);
  const [history, setHistory] = useState<ProjectHistoryResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setServices(architecture.services);
  }, [architecture]);

  useEffect(() => {
    setConnections(architecture.connections);
  }, [architecture]);

  useEffect(() => {
    let active = true;
    async function hydrateHistory() {
      try {
        const response = await loadProjectHistory(architecture.request_id);
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
  }, [architecture.request_id]);

  async function handleRegenerate() {
    setSaving(true);
    setError("");
    try {
      const rebuilt = await rebuildArchitecture({
        ...architecture,
        services,
        connections,
      });
      await saveProject({
        ...rebuilt,
        source_request: architecture.source_request,
        canvas_layout: architecture.canvas_layout,
        azure_deployment_profile: architecture.azure_deployment_profile,
        deployment_run: architecture.deployment_run,
      }, "Regenerated architecture from edited canvas");
      setHistory(await loadProjectHistory(architecture.request_id));
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
      await restoreProject(architecture.request_id, versionId);
      setHistory(await loadProjectHistory(architecture.request_id));
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
      <section className="quick-access-grid">
        <article className="card quick-access-card">
          <p className="eyebrow">Code</p>
          <h3>Open infrastructure code</h3>
          <p>Review provider baseline and per-component modules.</p>
          <HardLink
            className="inline-link"
            to={`/app/projects/${architecture.request_id}/code`}
          >
            Go to Code
          </HardLink>
        </article>

        <article className="card quick-access-card">
          <p className="eyebrow">Ship</p>
          <h3>Connect Azure and prepare deploy</h3>
          <p>Provide tenant or SPN details, choose a resource group, and prepare deployment.</p>
          <HardLink
            className="inline-link"
            to={`/app/projects/${architecture.request_id}/ship`}
          >
            Go to Ship
          </HardLink>
        </article>
      </section>

      <ArchitectureBoard
        architecture={architecture}
        services={services}
        connections={connections}
        onConnectionsChange={setConnections}
        onLayoutChange={(layout) =>
          updateCanvasLayout(architecture.request_id, layout)
        }
        onServicesChange={setServices}
      />

      <section className="card panel">
        <div className="compact-section-head">
          <div>
            <p className="eyebrow">Architecture Model</p>
            <h2>Regenerate from your canvas edits</h2>
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
          Select components directly on the diagram to rename, change type, add new services,
          or remove existing ones. Then regenerate to refresh the architecture, code, and deploy plan.
        </p>
      </section>

      <ArchitectureReport
        architecture={architecture}
        history={history}
        onDelete={onDelete}
        onRestoreVersion={handleRestore}
        restoringVersionId={restoringVersionId}
      />
    </div>
  );
}
