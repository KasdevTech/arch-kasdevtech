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
export type SolutionDomain =
  | "web_saas"
  | "data_platform"
  | "ai_platform"
  | "ai_governance"
  | "cybersecurity"
  | "fintech_platform"
  | "integration_platform"
  | "developer_platform"
  | "analytics_platform"
  | "enterprise_application";
export type SolutionArchetype =
  | "transactional_saas"
  | "event_driven_platform"
  | "data_processing_platform"
  | "ai_application_stack"
  | "ai_security_and_compliance"
  | "security_operations_center"
  | "fintech_transaction_platform"
  | "internal_developer_portal"
  | "integration_hub"
  | "analytics_and_reporting"
  | "enterprise_system_of_record";

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
  domain?: SolutionDomain;
  archetype?: SolutionArchetype;
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

export type ChatRole = "user" | "assistant";

export interface ArchitectChatMessage {
  role: ChatRole;
  content: string;
}

export interface ArchitectChatRequest {
  messages: ArchitectChatMessage[];
  cloud: CloudProvider;
  include_iac: boolean;
  preferences: ArchitecturePreferences;
}

export interface ArchitectChatResponse {
  reply: string;
  generated_architecture?: ArchitectureResponse | null;
  ready_to_generate: boolean;
}
