from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class CloudProvider(str, Enum):
    azure = "azure"
    aws = "aws"
    gcp = "gcp"


class AvailabilityTier(str, Enum):
    standard = "standard"
    high_availability = "high_availability"
    mission_critical = "mission_critical"


class DataSensitivity(str, Enum):
    internal = "internal"
    confidential = "confidential"
    regulated = "regulated"


class NetworkExposure(str, Enum):
    public = "public"
    private = "private"
    hybrid = "hybrid"


class UserScale(str, Enum):
    team = "team"
    business = "business"
    internet_scale = "internet_scale"


class ComplianceFramework(str, Enum):
    soc2 = "soc2"
    iso27001 = "iso27001"
    hipaa = "hipaa"
    pci_dss = "pci_dss"
    gdpr = "gdpr"


class TenancyModel(str, Enum):
    single_tenant = "single_tenant"
    pooled_multi_tenant = "pooled_multi_tenant"


class SolutionDomain(str, Enum):
    web_saas = "web_saas"
    data_platform = "data_platform"
    ai_platform = "ai_platform"
    ai_governance = "ai_governance"
    cybersecurity = "cybersecurity"
    fintech_platform = "fintech_platform"
    integration_platform = "integration_platform"
    developer_platform = "developer_platform"
    analytics_platform = "analytics_platform"
    enterprise_application = "enterprise_application"


class SolutionArchetype(str, Enum):
    transactional_saas = "transactional_saas"
    event_driven_platform = "event_driven_platform"
    data_processing_platform = "data_processing_platform"
    ai_application_stack = "ai_application_stack"
    ai_security_and_compliance = "ai_security_and_compliance"
    security_operations_center = "security_operations_center"
    fintech_transaction_platform = "fintech_transaction_platform"
    internal_developer_portal = "internal_developer_portal"
    integration_hub = "integration_hub"
    analytics_and_reporting = "analytics_and_reporting"
    enterprise_system_of_record = "enterprise_system_of_record"


class ComponentType(str, Enum):
    frontend = "frontend"
    backend_api = "backend_api"
    cicd_pipeline = "cicd_pipeline"
    database = "database"
    authentication = "authentication"
    cdn = "cdn"
    cache = "cache"
    queue = "queue"
    object_storage = "object_storage"
    monitoring = "monitoring"
    api_gateway = "api_gateway"
    waf = "waf"
    secrets = "secrets"
    private_network = "private_network"
    analytics = "analytics"
    policy_engine = "policy_engine"
    security_analytics = "security_analytics"
    discovery = "discovery"
    ai_model_gateway = "ai_model_gateway"
    search = "search"
    ml_platform = "ml_platform"
    integration = "integration"


class DatabaseKind(str, Enum):
    relational = "relational"
    document = "document"


def default_environments() -> list[str]:
    return ["dev", "staging", "prod"]


class ArchitecturePreferences(BaseModel):
    workload_name: Optional[str] = Field(default=None, max_length=120)
    environments: list[str] = Field(default_factory=default_environments)
    availability_tier: AvailabilityTier = AvailabilityTier.high_availability
    data_sensitivity: DataSensitivity = DataSensitivity.confidential
    network_exposure: NetworkExposure = NetworkExposure.public
    user_scale: UserScale = UserScale.business
    compliance_frameworks: list[ComplianceFramework] = Field(default_factory=list)
    multi_region: bool = False
    disaster_recovery: bool = True
    tenancy: TenancyModel = TenancyModel.pooled_multi_tenant


class ArchitectureRequest(BaseModel):
    prompt: str = Field(min_length=10, max_length=2000)
    cloud: CloudProvider = CloudProvider.azure
    include_iac: bool = False
    preferences: ArchitecturePreferences = Field(default_factory=ArchitecturePreferences)


class ParsedComponent(BaseModel):
    type: ComponentType
    label: str
    requirements: list[str] = Field(default_factory=list)
    database_kind: Optional[DatabaseKind] = None


class ArchitectureIntent(BaseModel):
    title: str
    summary: str
    cloud: CloudProvider
    domain: SolutionDomain = SolutionDomain.enterprise_application
    archetype: SolutionArchetype = SolutionArchetype.transactional_saas
    preferences: ArchitecturePreferences
    priorities: list[str] = Field(default_factory=list)
    patterns: list[str] = Field(default_factory=list)
    assumptions: list[str] = Field(default_factory=list)
    components: list[ParsedComponent] = Field(default_factory=list)


class ServiceMapping(BaseModel):
    id: str
    type: ComponentType
    label: str
    cloud_service: str
    category: str
    rationale: str


class Connection(BaseModel):
    source: str
    target: str
    label: Optional[str] = None
    dashed: bool = False


class ExplanationSection(BaseModel):
    title: str
    body: str


class ArchitectureValidationFinding(BaseModel):
    severity: str
    message: str
    recommendation: str


class ArchitectureResponse(BaseModel):
    request_id: str
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )
    title: str
    summary: str
    cloud: CloudProvider
    domain: SolutionDomain = SolutionDomain.enterprise_application
    archetype: SolutionArchetype = SolutionArchetype.transactional_saas
    preferences: ArchitecturePreferences
    priorities: list[str]
    assumptions: list[str]
    topology_highlights: list[str]
    security_controls: list[str]
    resilience_notes: list[str]
    operational_controls: list[str]
    risk_flags: list[str]
    services: list[ServiceMapping]
    connections: list[Connection]
    explanation_sections: list[ExplanationSection]
    recommended_next_steps: list[str]
    confidence_score: float = 0.0
    matched_pattern: Optional[str] = None
    validator_findings: list[ArchitectureValidationFinding] = Field(default_factory=list)
    mermaid: str
    iac_template: Optional[str] = None


class ChatRole(str, Enum):
    user = "user"
    assistant = "assistant"


class ChatMessage(BaseModel):
    role: ChatRole
    content: str = Field(min_length=1, max_length=4000)


class ArchitectChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=30)
    cloud: CloudProvider = CloudProvider.azure
    include_iac: bool = False
    preferences: ArchitecturePreferences = Field(default_factory=ArchitecturePreferences)


class ArchitectChatResponse(BaseModel):
    reply: str
    generated_architecture: Optional[ArchitectureResponse] = None
    ready_to_generate: bool = False
