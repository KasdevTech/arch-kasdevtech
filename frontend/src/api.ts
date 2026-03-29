import type { ArchitectureRequest, ArchitectureResponse } from "./types";

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

