import type {
  ArchitecturePreferences,
  ArchitectureRequest,
  ArchitectureResponse,
  CloudProvider,
  ComplianceFramework,
} from "../types";

export const CLOUD_OPTIONS: Array<{
  value: CloudProvider;
  label: string;
  blurb: string;
}> = [
  {
    value: "azure",
    label: "Azure",
    blurb: "Strong fit for enterprise identity, API governance, and managed platform services.",
  },
  {
    value: "aws",
    label: "AWS",
    blurb: "Strong fit for broad enterprise primitives and mature network-control patterns.",
  },
  {
    value: "gcp",
    label: "GCP",
    blurb: "Strong fit for serverless platforms, developer velocity, and global delivery.",
  },
];

export const QUICK_PROMPTS = [
  "Design a customer-facing SaaS platform with a React frontend, backend APIs, PostgreSQL, SSO, auditability, CDN, and secure file exports.",
  "Build a regulated healthcare portal with authentication, private networking, relational data, document storage, observability, and disaster recovery.",
  "Create a global B2B operations platform with frontend, APIs, background jobs, caching, multi-region failover, and governed integrations.",
];

export const ENVIRONMENT_OPTIONS = ["dev", "staging", "prod", "dr"];

export const COMPLIANCE_OPTIONS: Array<{
  value: ComplianceFramework;
  label: string;
}> = [
  { value: "soc2", label: "SOC 2" },
  { value: "iso27001", label: "ISO 27001" },
  { value: "hipaa", label: "HIPAA" },
  { value: "pci_dss", label: "PCI DSS" },
  { value: "gdpr", label: "GDPR" },
];

export const DEFAULT_PROMPT =
  "Build a secure enterprise web platform with a frontend, backend API, relational database, SSO, CDN, auditability, and observability.";

export const DEFAULT_PREFERENCES: ArchitecturePreferences = {
  workload_name: "Customer Platform",
  environments: ["dev", "staging", "prod"],
  availability_tier: "high_availability",
  data_sensitivity: "confidential",
  network_exposure: "public",
  user_scale: "business",
  compliance_frameworks: ["soc2"],
  multi_region: false,
  disaster_recovery: true,
  tenancy: "pooled_multi_tenant",
};

export const VALUE_LABELS: Record<string, string> = {
  standard: "Standard",
  high_availability: "High availability",
  mission_critical: "Mission critical",
  internal: "Internal",
  confidential: "Confidential",
  regulated: "Regulated",
  public: "Public",
  private: "Private",
  hybrid: "Hybrid",
  team: "Team",
  business: "Business",
  internet_scale: "Internet scale",
  single_tenant: "Single tenant",
  pooled_multi_tenant: "Pooled multi-tenant",
  soc2: "SOC 2",
  iso27001: "ISO 27001",
  hipaa: "HIPAA",
  pci_dss: "PCI DSS",
  gdpr: "GDPR",
};

export interface ArchitectureTemplate {
  id: string;
  title: string;
  description: string;
  request: ArchitectureRequest;
  tags: string[];
  preview: ArchitectureResponse;
}

function buildAzurePreview(
  requestId: string,
  title: string,
  summary: string,
  request: ArchitectureRequest,
  services: ArchitectureResponse["services"],
  connections: ArchitectureResponse["connections"],
  canvasLayout: NonNullable<ArchitectureResponse["canvas_layout"]>,
): ArchitectureResponse {
  return {
    request_id: requestId,
    created_at: new Date("2026-03-21T10:00:00.000Z").toISOString(),
    title,
    summary,
    cloud: "azure",
    preferences: request.preferences,
    priorities: ["high_availability", "confidential"],
    assumptions: ["Reference blueprint for product preview."],
    topology_highlights: ["Structured reference architecture preview."],
    security_controls: ["WAF, managed identity, and key isolation."],
    resilience_notes: ["Multi-layer managed platform topology."],
    operational_controls: ["Centralized observability and API governance."],
    risk_flags: [],
    services,
    connections,
    explanation_sections: [],
    recommended_next_steps: [],
    mermaid: "",
    iac_template: null,
    source_request: request,
    canvas_layout: canvasLayout,
  };
}

export const ARCHITECTURE_TEMPLATES: ArchitectureTemplate[] = [
  {
    id: "enterprise-saas",
    title: "Enterprise SaaS Platform",
    description:
      "A customer-facing platform with governed APIs, SSO, relational data, and platform operations.",
    tags: ["Public edge", "SSO", "API governance"],
    request: {
      prompt:
        "Design a customer-facing enterprise SaaS platform with a web frontend, API layer, relational database, SSO, WAF, CDN, secrets management, and observability.",
      cloud: "azure",
      include_iac: true,
      preferences: {
        workload_name: "Customer Platform",
        environments: ["dev", "staging", "prod"],
        availability_tier: "high_availability",
        data_sensitivity: "confidential",
        network_exposure: "public",
        user_scale: "business",
        compliance_frameworks: ["soc2", "gdpr"],
        multi_region: false,
        disaster_recovery: true,
        tenancy: "pooled_multi_tenant",
      },
    },
    preview: buildAzurePreview(
      "template-enterprise-saas",
      "Enterprise SaaS Platform",
      "A customer-facing platform with governed APIs, SSO, relational data, and platform operations.",
      {
        prompt:
          "Design a customer-facing enterprise SaaS platform with a web frontend, API layer, relational database, SSO, WAF, CDN, secrets management, and observability.",
        cloud: "azure",
        include_iac: true,
        preferences: {
          workload_name: "Customer Platform",
          environments: ["dev", "staging", "prod"],
          availability_tier: "high_availability",
          data_sensitivity: "confidential",
          network_exposure: "public",
          user_scale: "business",
          compliance_frameworks: ["soc2", "gdpr"],
          multi_region: false,
          disaster_recovery: true,
          tenancy: "pooled_multi_tenant",
        },
      },
      [
        { id: "waf", type: "waf", label: "Web application firewall", cloud_service: "Azure Web Application Firewall", category: "security", rationale: "" },
        { id: "cdn", type: "cdn", label: "Global edge layer", cloud_service: "Azure Front Door", category: "edge", rationale: "" },
        { id: "frontend", type: "frontend", label: "Web frontend", cloud_service: "Azure Static Web Apps", category: "presentation", rationale: "" },
        { id: "authentication", type: "authentication", label: "Authentication", cloud_service: "Microsoft Entra External ID", category: "identity", rationale: "" },
        { id: "api_gateway", type: "api_gateway", label: "API gateway", cloud_service: "Azure API Management", category: "api", rationale: "" },
        { id: "backend_api", type: "backend_api", label: "Application API", cloud_service: "Azure App Service", category: "compute", rationale: "" },
        { id: "database", type: "database", label: "Primary database", cloud_service: "Azure SQL Database", category: "data", rationale: "" },
        { id: "secrets", type: "secrets", label: "Secrets management", cloud_service: "Azure Key Vault", category: "security", rationale: "" },
        { id: "monitoring", type: "monitoring", label: "Monitoring", cloud_service: "Azure Monitor", category: "operations", rationale: "" },
      ],
      [
        { source: "users", target: "waf", label: "HTTPS", dashed: false },
        { source: "waf", target: "cdn", label: "Filtered traffic", dashed: false },
        { source: "cdn", target: "frontend", label: "Static assets", dashed: false },
        { source: "frontend", target: "api_gateway", label: "API calls", dashed: false },
        { source: "authentication", target: "api_gateway", label: "Identity", dashed: true },
        { source: "api_gateway", target: "backend_api", label: "Routed traffic", dashed: false },
        { source: "backend_api", target: "database", label: "Reads/Writes", dashed: false },
        { source: "backend_api", target: "secrets", label: "Secrets", dashed: true },
        { source: "backend_api", target: "monitoring", label: "Telemetry", dashed: true },
        { source: "database", target: "monitoring", label: "Metrics", dashed: true },
      ],
      {
        waf: { x: 260, y: 120 },
        cdn: { x: 260, y: 250 },
        frontend: { x: 260, y: 380 },
        authentication: { x: 260, y: 510 },
        api_gateway: { x: 530, y: 290 },
        backend_api: { x: 530, y: 430 },
        database: { x: 800, y: 320 },
        secrets: { x: 800, y: 470 },
        monitoring: { x: 1070, y: 350 },
      },
    ),
  },
  {
    id: "regulated-portal",
    title: "Regulated Digital Portal",
    description:
      "A private-sensitive workload with stronger compliance posture, DR, and controlled service boundaries.",
    tags: ["Regulated data", "Private network", "DR ready"],
    request: {
      prompt:
        "Create a regulated portal with secure frontend delivery, API gateway, private app services, relational data, SSO, key management, network isolation, and strong operational controls.",
      cloud: "azure",
      include_iac: true,
      preferences: {
        workload_name: "Regulated Portal",
        environments: ["dev", "staging", "prod", "dr"],
        availability_tier: "mission_critical",
        data_sensitivity: "regulated",
        network_exposure: "private",
        user_scale: "business",
        compliance_frameworks: ["hipaa", "iso27001"],
        multi_region: true,
        disaster_recovery: true,
        tenancy: "single_tenant",
      },
    },
    preview: buildAzurePreview(
      "template-regulated-portal",
      "Regulated Digital Portal",
      "A private-sensitive workload with stronger compliance posture, DR, and controlled service boundaries.",
      {
        prompt:
          "Create a regulated portal with secure frontend delivery, API gateway, private app services, relational data, SSO, key management, network isolation, and strong operational controls.",
        cloud: "azure",
        include_iac: true,
        preferences: {
          workload_name: "Regulated Portal",
          environments: ["dev", "staging", "prod", "dr"],
          availability_tier: "mission_critical",
          data_sensitivity: "regulated",
          network_exposure: "private",
          user_scale: "business",
          compliance_frameworks: ["hipaa", "iso27001"],
          multi_region: true,
          disaster_recovery: true,
          tenancy: "single_tenant",
        },
      },
      [
        { id: "waf", type: "waf", label: "WAF", cloud_service: "Azure Web Application Firewall", category: "security", rationale: "" },
        { id: "cdn", type: "cdn", label: "Controlled ingress", cloud_service: "Azure Front Door", category: "edge", rationale: "" },
        { id: "frontend", type: "frontend", label: "Portal frontend", cloud_service: "Azure Static Web Apps", category: "presentation", rationale: "" },
        { id: "authentication", type: "authentication", label: "SSO", cloud_service: "Microsoft Entra External ID", category: "identity", rationale: "" },
        { id: "api_gateway", type: "api_gateway", label: "API policy plane", cloud_service: "Azure API Management", category: "api", rationale: "" },
        { id: "backend_api", type: "backend_api", label: "Private application tier", cloud_service: "Azure App Service", category: "compute", rationale: "" },
        { id: "database", type: "database", label: "Primary regulated data", cloud_service: "Azure SQL Database", category: "data", rationale: "" },
        { id: "secrets", type: "secrets", label: "Key and secret control", cloud_service: "Azure Key Vault", category: "security", rationale: "" },
        { id: "private_network", type: "private_network", label: "Private network", cloud_service: "Azure Virtual Networks", category: "network", rationale: "" },
        { id: "monitoring", type: "monitoring", label: "Audit and telemetry", cloud_service: "Azure Monitor", category: "operations", rationale: "" },
      ],
      [
        { source: "users", target: "waf", label: "HTTPS", dashed: false },
        { source: "waf", target: "cdn", label: "Inspected", dashed: false },
        { source: "cdn", target: "frontend", label: "Portal traffic", dashed: false },
        { source: "frontend", target: "api_gateway", label: "API requests", dashed: false },
        { source: "authentication", target: "api_gateway", label: "Identity", dashed: true },
        { source: "api_gateway", target: "backend_api", label: "Private access", dashed: false },
        { source: "backend_api", target: "database", label: "Transactional data", dashed: false },
        { source: "backend_api", target: "secrets", label: "Secrets", dashed: true },
        { source: "backend_api", target: "private_network", label: "VNet integration", dashed: true },
        { source: "backend_api", target: "monitoring", label: "Audit", dashed: true },
        { source: "database", target: "monitoring", label: "Telemetry", dashed: true },
      ],
      {
        waf: { x: 260, y: 110 },
        cdn: { x: 260, y: 235 },
        frontend: { x: 260, y: 360 },
        authentication: { x: 260, y: 485 },
        api_gateway: { x: 530, y: 240 },
        backend_api: { x: 530, y: 390 },
        database: { x: 800, y: 235 },
        secrets: { x: 800, y: 385 },
        private_network: { x: 1070, y: 220 },
        monitoring: { x: 1070, y: 390 },
      },
    ),
  },
  {
    id: "global-ops",
    title: "Global Operations Platform",
    description:
      "An internet-scale operating platform with jobs, events, and global delivery concerns.",
    tags: ["Multi-region", "Async jobs", "Internet scale"],
    request: {
      prompt:
        "Build a global B2B operations platform with frontend, API management, compute services, caching, event-driven jobs, relational data, observability, and multi-region resilience.",
      cloud: "azure",
      include_iac: true,
      preferences: {
        workload_name: "Global Ops",
        environments: ["dev", "staging", "prod", "dr"],
        availability_tier: "mission_critical",
        data_sensitivity: "confidential",
        network_exposure: "public",
        user_scale: "internet_scale",
        compliance_frameworks: ["soc2"],
        multi_region: true,
        disaster_recovery: true,
        tenancy: "pooled_multi_tenant",
      },
    },
    preview: buildAzurePreview(
      "template-global-ops",
      "Global Operations Platform",
      "An internet-scale operating platform with jobs, events, and global delivery concerns.",
      {
        prompt:
          "Build a global B2B operations platform with frontend, API management, compute services, caching, event-driven jobs, relational data, observability, and multi-region resilience.",
        cloud: "azure",
        include_iac: true,
        preferences: {
          workload_name: "Global Ops",
          environments: ["dev", "staging", "prod", "dr"],
          availability_tier: "mission_critical",
          data_sensitivity: "confidential",
          network_exposure: "public",
          user_scale: "internet_scale",
          compliance_frameworks: ["soc2"],
          multi_region: true,
          disaster_recovery: true,
          tenancy: "pooled_multi_tenant",
        },
      },
      [
        { id: "cdn", type: "cdn", label: "Global delivery", cloud_service: "Azure Front Door", category: "edge", rationale: "" },
        { id: "frontend", type: "frontend", label: "Operations frontend", cloud_service: "Azure Static Web Apps", category: "presentation", rationale: "" },
        { id: "api_gateway", type: "api_gateway", label: "API control plane", cloud_service: "Azure API Management", category: "api", rationale: "" },
        { id: "backend_api", type: "backend_api", label: "Core compute tier", cloud_service: "Azure App Service", category: "compute", rationale: "" },
        { id: "cache", type: "cache", label: "Hot cache", cloud_service: "Azure Cache for Redis", category: "cache", rationale: "" },
        { id: "queue", type: "queue", label: "Async jobs", cloud_service: "Azure Service Bus", category: "messaging", rationale: "" },
        { id: "database", type: "database", label: "Operational datastore", cloud_service: "Azure SQL Database", category: "data", rationale: "" },
        { id: "monitoring", type: "monitoring", label: "Operations telemetry", cloud_service: "Azure Monitor", category: "operations", rationale: "" },
      ],
      [
        { source: "users", target: "cdn", label: "Global HTTPS", dashed: false },
        { source: "cdn", target: "frontend", label: "Edge delivery", dashed: false },
        { source: "frontend", target: "api_gateway", label: "API requests", dashed: false },
        { source: "api_gateway", target: "backend_api", label: "Routed traffic", dashed: false },
        { source: "backend_api", target: "cache", label: "Cached reads", dashed: false },
        { source: "backend_api", target: "queue", label: "Background jobs", dashed: false },
        { source: "backend_api", target: "database", label: "Transactions", dashed: false },
        { source: "backend_api", target: "monitoring", label: "Telemetry", dashed: true },
        { source: "database", target: "monitoring", label: "Metrics", dashed: true },
      ],
      {
        cdn: { x: 260, y: 180 },
        frontend: { x: 260, y: 320 },
        api_gateway: { x: 530, y: 220 },
        backend_api: { x: 530, y: 380 },
        cache: { x: 800, y: 180 },
        queue: { x: 800, y: 320 },
        database: { x: 800, y: 460 },
        monitoring: { x: 1070, y: 320 },
      },
    ),
  },
];
