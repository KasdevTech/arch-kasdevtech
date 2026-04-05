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

export interface ArchitectureValidationFinding {
  severity: string;
  message: string;
  recommendation: string;
}

export interface ArchitectureRetrievalMatch {
  pattern_id: string;
  title: string;
  domain: SolutionDomain;
  archetype: SolutionArchetype;
  score: number;
}

export type AzureAuthMode = "tenant_user" | "service_principal";

export interface AzureDeploymentProfile {
  auth_mode: AzureAuthMode;
  tenant_id: string;
  subscription_id: string;
  client_id?: string;
  client_secret?: string;
  resource_group: string;
  location: string;
  deployment_name: string;
}

export interface DeploymentRun {
  status: "idle" | "prepared" | "deploying" | "ready" | "deployed" | "failed";
  summary: string;
  generated_at: string;
  command_preview: string[];
}

export interface AzureDeploymentPlanItem {
  service_id: string;
  title: string;
  resource_type: string;
  location: string;
  action: string;
  supported: boolean;
  note?: string | null;
}

export interface AzureDeploymentRequest {
  project_id: string;
  project_title: string;
  cloud: CloudProvider;
  profile: AzureDeploymentProfile;
  preferences: ArchitecturePreferences;
  services: ServiceMapping[];
}

export interface AzureDeploymentPrepareResponse {
  status: string;
  summary: string;
  resource_group: string;
  location: string;
  deployable_count: number;
  skipped_count: number;
  plan_items: AzureDeploymentPlanItem[];
  command_preview: string[];
  warnings: string[];
}

export interface AzureDeploymentResponse {
  status: string;
  resource_group: string;
  location: string;
  deployment_name: string;
  logs: string[];
  deployed_services: string[];
  skipped_services: string[];
  deployed_at: string;
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
  confidence_score?: number;
  classification_confidence?: number;
  matched_pattern?: string | null;
  retrieval_matches?: ArchitectureRetrievalMatch[];
  validator_findings?: ArchitectureValidationFinding[];
  mermaid: string;
  iac_template?: string | null;
  source_request?: ArchitectureRequest;
  canvas_layout?: CanvasLayout;
  azure_deployment_profile?: AzureDeploymentProfile;
  deployment_run?: DeploymentRun | null;
}

export interface ProjectVersionSummary {
  version_id: string;
  version_number: number;
  saved_at: string;
  title: string;
  summary: string;
  change_note?: string | null;
}

export interface ProjectHistoryResponse {
  project_id: string;
  current_version: number;
  versions: ProjectVersionSummary[];
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
