import type {
  ArchitectChatRequest,
  ArchitectChatResponse,
  ArchitectureRequest,
  ArchitectureResponse,
  AzureDeploymentPrepareResponse,
  AzureDeploymentRequest,
  AzureDeploymentResponse,
  CanvasLayout,
  DeploymentRun,
  ProjectHistoryResponse,
  AzureDeploymentProfile,
} from "./types";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

export async function generateArchitecture(
  payload: ArchitectureRequest,
): Promise<ArchitectureResponse> {
  const response = await fetch(`${API_BASE_URL}/architectures/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      `Architecture generation failed with status ${response.status}.`,
    );
  }

  return response.json() as Promise<ArchitectureResponse>;
}

export async function chatWithArchitect(
  payload: ArchitectChatRequest,
): Promise<ArchitectChatResponse> {
  const response = await fetch(`${API_BASE_URL}/architectures/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Architect chat failed with status ${response.status}.`);
  }

  return response.json() as Promise<ArchitectChatResponse>;
}

export async function deployToAzure(
  payload: AzureDeploymentRequest,
): Promise<AzureDeploymentResponse> {
  const response = await fetch(`${API_BASE_URL}/architectures/deploy/azure`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Azure deployment failed with status ${response.status}.`);
  }

  return response.json() as Promise<AzureDeploymentResponse>;
}

export async function prepareAzureDeployment(
  payload: AzureDeploymentRequest,
): Promise<AzureDeploymentPrepareResponse> {
  const response = await fetch(`${API_BASE_URL}/architectures/deploy/azure/prepare`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Azure deployment prepare failed with status ${response.status}.`);
  }

  return response.json() as Promise<AzureDeploymentPrepareResponse>;
}

export async function rebuildArchitecture(
  architecture: ArchitectureResponse,
): Promise<ArchitectureResponse> {
  const response = await fetch(`${API_BASE_URL}/architectures/rebuild`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ architecture }),
  });

  if (!response.ok) {
    throw new Error(`Architecture rebuild failed with status ${response.status}.`);
  }

  return response.json() as Promise<ArchitectureResponse>;
}

export async function listProjects(): Promise<ArchitectureResponse[]> {
  const response = await fetch(`${API_BASE_URL}/projects`);
  if (!response.ok) {
    throw new Error(`Project listing failed with status ${response.status}.`);
  }
  return response.json() as Promise<ArchitectureResponse[]>;
}

export async function saveProjectRemote(
  project: ArchitectureResponse,
  changeNote?: string,
): Promise<ArchitectureResponse> {
  const response = await fetch(`${API_BASE_URL}/projects/${project.request_id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      architecture: project,
      change_note: changeNote,
    }),
  });
  if (!response.ok) {
    throw new Error(`Project save failed with status ${response.status}.`);
  }
  return response.json() as Promise<ArchitectureResponse>;
}

export async function deleteProjectRemote(projectId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`Project deletion failed with status ${response.status}.`);
  }
}

export async function updateCanvasLayoutRemote(
  projectId: string,
  canvasLayout: CanvasLayout,
): Promise<ArchitectureResponse> {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/canvas-layout`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ canvas_layout: canvasLayout }),
  });
  if (!response.ok) {
    throw new Error(`Canvas save failed with status ${response.status}.`);
  }
  return response.json() as Promise<ArchitectureResponse>;
}

export async function updateDeploymentProfileRemote(
  projectId: string,
  profile: AzureDeploymentProfile,
  run: DeploymentRun | null,
): Promise<ArchitectureResponse> {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/deployment-profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ profile, run }),
  });
  if (!response.ok) {
    throw new Error(`Deployment profile save failed with status ${response.status}.`);
  }
  return response.json() as Promise<ArchitectureResponse>;
}

export async function getProjectHistory(
  projectId: string,
): Promise<ProjectHistoryResponse> {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/history`);
  if (!response.ok) {
    throw new Error(`Project history failed with status ${response.status}.`);
  }
  return response.json() as Promise<ProjectHistoryResponse>;
}

export async function restoreProjectVersion(
  projectId: string,
  versionId: string,
): Promise<ArchitectureResponse> {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/restore/${versionId}`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(`Project restore failed with status ${response.status}.`);
  }
  return response.json() as Promise<ArchitectureResponse>;
}
