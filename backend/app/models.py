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


class ComponentType(str, Enum):
    frontend = "frontend"
    backend_api = "backend_api"
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


class ArchitectureResponse(BaseModel):
    request_id: str
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )
    title: str
    summary: str
    cloud: CloudProvider
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
    mermaid: str
    iac_template: Optional[str] = None
