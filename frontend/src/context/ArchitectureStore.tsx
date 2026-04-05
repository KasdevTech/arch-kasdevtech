import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import {
  deleteProjectRemote,
  getProjectHistory,
  listProjects,
  restoreProjectVersion,
  saveProjectRemote,
  updateCanvasLayoutRemote,
  updateDeploymentProfileRemote,
} from "../api";
import type {
  ArchitectureResponse,
  AzureDeploymentProfile,
  CanvasLayout,
  DeploymentRun,
  ProjectHistoryResponse,
} from "../types";

const STORAGE_KEY = "ai-architect-projects";

interface ArchitectureStoreValue {
  hydrated: boolean;
  projects: ArchitectureResponse[];
  getProject: (projectId: string) => ArchitectureResponse | undefined;
  removeProject: (projectId: string) => Promise<void>;
  saveProject: (project: ArchitectureResponse, changeNote?: string) => Promise<ArchitectureResponse>;
  updateCanvasLayout: (projectId: string, canvasLayout: CanvasLayout) => Promise<void>;
  updateDeploymentProfile: (
    projectId: string,
    profile: AzureDeploymentProfile,
    run: DeploymentRun | null,
  ) => Promise<void>;
  loadProjectHistory: (projectId: string) => Promise<ProjectHistoryResponse>;
  restoreProject: (projectId: string, versionId: string) => Promise<ArchitectureResponse>;
}

const ArchitectureStoreContext = createContext<ArchitectureStoreValue | null>(null);

function readLocalProjects(): ArchitectureResponse[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as ArchitectureResponse[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function ArchitectureStoreProvider({ children }: PropsWithChildren) {
  const [hydrated, setHydrated] = useState(false);
  const [projects, setProjects] = useState<ArchitectureResponse[]>([]);

  useEffect(() => {
    let active = true;

    async function hydrate() {
      const localProjects = readLocalProjects();
      try {
        const remoteProjects = await listProjects();
        if (!active) {
          return;
        }
        if (remoteProjects.length > 0) {
          setProjects(remoteProjects);
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteProjects));
          setHydrated(true);
          return;
        }

        if (localProjects.length > 0) {
          const imported: ArchitectureResponse[] = [];
          for (const project of localProjects) {
            const saved = await saveProjectRemote(project, "Imported from local workspace");
            imported.push(saved);
          }
          if (!active) {
            return;
          }
          setProjects(imported);
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(imported));
          setHydrated(true);
          return;
        }

        setProjects([]);
      } catch {
        setProjects(localProjects);
      } finally {
        if (active) {
          setHydrated(true);
        }
      }
    }

    void hydrate();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [hydrated, projects]);

  const projectMap = useMemo(
    () => new Map(projects.map((project) => [project.request_id, project])),
    [projects],
  );

  function getProject(projectId: string) {
    return projectMap.get(projectId);
  }

  async function saveProject(project: ArchitectureResponse, changeNote?: string) {
    const optimistic = {
      ...project,
      updated_at: new Date().toISOString(),
    };
    setProjects((current) => {
      const next = [optimistic, ...current.filter((item) => item.request_id !== project.request_id)];
      return next.slice(0, 100);
    });

    try {
      const persisted = await saveProjectRemote(project, changeNote);
      setProjects((current) => [persisted, ...current.filter((item) => item.request_id !== persisted.request_id)]);
      return persisted;
    } catch {
      return optimistic;
    }
  }

  async function removeProject(projectId: string) {
    const previous = projects;
    setProjects((current) => current.filter((item) => item.request_id !== projectId));
    try {
      await deleteProjectRemote(projectId);
    } catch {
      setProjects(previous);
      throw new Error("Unable to remove project right now.");
    }
  }

  async function updateCanvasLayout(projectId: string, canvasLayout: CanvasLayout) {
    setProjects((current) =>
      current.map((item) =>
        item.request_id === projectId ? { ...item, canvas_layout: canvasLayout } : item,
      ),
    );
    try {
      const persisted = await updateCanvasLayoutRemote(projectId, canvasLayout);
      setProjects((current) =>
        current.map((item) => (item.request_id === projectId ? persisted : item)),
      );
    } catch {
      // keep optimistic local layout if backend is unavailable
    }
  }

  async function updateDeploymentProfile(
    projectId: string,
    profile: AzureDeploymentProfile,
    run: DeploymentRun | null,
  ) {
    setProjects((current) =>
      current.map((item) =>
        item.request_id === projectId
          ? { ...item, azure_deployment_profile: profile, deployment_run: run }
          : item,
      ),
    );
    try {
      const persisted = await updateDeploymentProfileRemote(projectId, profile, run);
      setProjects((current) =>
        current.map((item) => (item.request_id === projectId ? persisted : item)),
      );
    } catch {
      // keep optimistic deployment state if backend is unavailable
    }
  }

  async function loadProjectHistory(projectId: string) {
    return getProjectHistory(projectId);
  }

  async function restoreProject(projectId: string, versionId: string) {
    const restored = await restoreProjectVersion(projectId, versionId);
    setProjects((current) => [restored, ...current.filter((item) => item.request_id !== projectId)]);
    return restored;
  }

  return (
    <ArchitectureStoreContext.Provider
      value={{
        hydrated,
        projects,
        getProject,
        removeProject,
        saveProject,
        updateCanvasLayout,
        updateDeploymentProfile,
        loadProjectHistory,
        restoreProject,
      }}
    >
      {children}
    </ArchitectureStoreContext.Provider>
  );
}

export function useArchitectureStore() {
  const context = useContext(ArchitectureStoreContext);

  if (!context) {
    throw new Error("useArchitectureStore must be used within ArchitectureStoreProvider.");
  }

  return context;
}
