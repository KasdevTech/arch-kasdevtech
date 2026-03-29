import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import type { ArchitectureResponse, CanvasLayout } from "../types";

const STORAGE_KEY = "ai-architect-projects";

interface ArchitectureStoreValue {
  hydrated: boolean;
  projects: ArchitectureResponse[];
  getProject: (projectId: string) => ArchitectureResponse | undefined;
  removeProject: (projectId: string) => void;
  saveProject: (project: ArchitectureResponse) => void;
  updateCanvasLayout: (projectId: string, canvasLayout: CanvasLayout) => void;
}

const ArchitectureStoreContext = createContext<ArchitectureStoreValue | null>(
  null,
);

export function ArchitectureStoreProvider({
  children,
}: PropsWithChildren) {
  const [hydrated, setHydrated] = useState(false);
  const [projects, setProjects] = useState<ArchitectureResponse[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ArchitectureResponse[];
        setProjects(Array.isArray(parsed) ? parsed : []);
      }
    } catch {
      setProjects([]);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [hydrated, projects]);

  function saveProject(project: ArchitectureResponse) {
    setProjects((current) => {
      const deduped = current.filter(
        (item) => item.request_id !== project.request_id,
      );
      return [project, ...deduped].slice(0, 30);
    });
  }

  function getProject(projectId: string) {
    return projects.find((item) => item.request_id === projectId);
  }

  function updateCanvasLayout(projectId: string, canvasLayout: CanvasLayout) {
    setProjects((current) =>
      current.map((item) =>
        item.request_id === projectId
          ? { ...item, canvas_layout: canvasLayout }
          : item,
      ),
    );
  }

  function removeProject(projectId: string) {
    setProjects((current) =>
      current.filter((item) => item.request_id !== projectId),
    );
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
      }}
    >
      {children}
    </ArchitectureStoreContext.Provider>
  );
}

export function useArchitectureStore() {
  const context = useContext(ArchitectureStoreContext);

  if (!context) {
    throw new Error(
      "useArchitectureStore must be used within ArchitectureStoreProvider.",
    );
  }

  return context;
}
