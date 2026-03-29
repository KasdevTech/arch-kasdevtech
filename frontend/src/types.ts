export type CloudProvider = "azure" | "aws" | "gcp";
export type AvailabilityTier =
  | "standard"
  | "high_availability"
  | "mission_critical";
export type DataSensitivity = "internal" | "confidential" | "regulated";
export type NetworkExposure = "public" | "private" | "hybrid";
export type UserScale = "team" | "business" | "internet_scale";
export type ComplianceFramework =
  | "soc2"
  | "iso27001"
  | "hipaa"
  | "pci_dss"
  | "gdpr";
export type TenancyModel = "single_tenant" | "pooled_multi_tenant";

export interface ArchitecturePreferences {
  workload_name?: string | null;
  environments: string[];
  availability_tier: AvailabilityTier;
  data_sensitivity: DataSensitivity;
  network_exposure: NetworkExposure;
  user_scale: UserScale;
  compliance_frameworks: ComplianceFramework[];
  multi_region: boolean;
  disaster_recovery: boolean;
  tenancy: TenancyModel;
}

export interface ArchitectureRequest {
  prompt: string;
  cloud: CloudProvider;
  include_iac: boolean;
  preferences: ArchitecturePreferences;
}

export interface ServiceMapping {
  id: string;
  type: string;
  label: string;
  cloud_service: string;
  category: string;
  rationale: string;
}

export interface Connection {
  source: string;
  target: string;
  label?: string | null;
  dashed: boolean;
}

export interface ExplanationSection {
  title: string;
  body: string;
}

export interface CanvasPosition {
  x: number;
  y: number;
}

export type CanvasLayout = Record<string, CanvasPosition>;

export interface ArchitectureResponse {
  request_id: string;
  created_at: string;
  title: string;
  summary: string;
  cloud: CloudProvider;
  preferences: ArchitecturePreferences;
  priorities: string[];
  assumptions: string[];
  topology_highlights: string[];
  security_controls: string[];
  resilience_notes: string[];
  operational_controls: string[];
  risk_flags: string[];
  services: ServiceMapping[];
  connections: Connection[];
  explanation_sections: ExplanationSection[];
  recommended_next_steps: string[];
  mermaid: string;
  iac_template?: string | null;
  source_request?: ArchitectureRequest;
  canvas_layout?: CanvasLayout;
}
