import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { deployToAzure, prepareAzureDeployment } from "../api";
import { useArchitectureStore } from "../context/ArchitectureStore";
import type {
  AzureAuthMode,
  AzureDeploymentPlanItem,
  AzureDeploymentPrepareResponse,
  AzureDeploymentResponse,
  AzureDeploymentProfile,
  ServiceMapping,
  DeploymentRun,
} from "../types";
import type { ProjectRouteContext } from "./ArchitectureDetailPage";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildDefaultProfile(title: string): AzureDeploymentProfile {
  const slug = slugify(title || "architecture");

  return {
    auth_mode: "service_principal",
    tenant_id: "",
    subscription_id: "",
    client_id: "",
    client_secret: "",
    resource_group: `${slug}-rg`,
    location: "centralindia",
    deployment_name: `${slug}-deploy`,
  };
}

function buildCommandPreview(
  profile: AzureDeploymentProfile,
): string[] {
  const loginCommand =
    profile.auth_mode === "service_principal"
      ? `az login --service-principal --username "${profile.client_id}" --password "<client-secret>" --tenant "${profile.tenant_id}"`
      : `az login --tenant "${profile.tenant_id}"`;

  const commands = [
    loginCommand,
    `az account set --subscription "${profile.subscription_id}"`,
    `az group create --name "${profile.resource_group}" --location "${profile.location}"`,
    "terraform init -input=false",
    "terraform plan -input=false -out=tfplan",
    "terraform apply -input=false -auto-approve tfplan",
  ];

  return commands;
}

type PlannedResource = {
  title: string;
  resourceType: string;
  location: string;
  action: string;
  supported: boolean;
  note?: string;
};

const STATIC_WEBAPP_REGIONS = new Set([
  "westus2",
  "centralus",
  "eastus2",
  "westeurope",
  "eastasia",
]);

function resolveStaticWebAppLocation(location: string) {
  const normalized = location.trim().toLowerCase();
  return STATIC_WEBAPP_REGIONS.has(normalized) ? normalized : "eastus2";
}

function buildShipPlan(
  title: string,
  profile: AzureDeploymentProfile,
  services: ServiceMapping[],
): PlannedResource[] {
  const baseName = slugify(title || "architecture");
  const plan: PlannedResource[] = [
    {
      title: profile.resource_group,
      resourceType: "Resource Group",
      location: profile.location,
      action: "Create or update deployment resource group",
      supported: true,
    },
  ];

  services.forEach((service) => {
    if (service.type === "frontend") {
      const effectiveLocation = resolveStaticWebAppLocation(profile.location);
      plan.push({
        title: `${baseName}-frontend`,
        resourceType: "Azure Static Web App",
        location: effectiveLocation,
        action: `Deploy ${service.label}`,
        supported: true,
        note:
          effectiveLocation !== profile.location
            ? `Static Web Apps are not available in ${profile.location}; this will deploy in ${effectiveLocation}.`
            : undefined,
      });
      return;
    }

    if (service.type === "object_storage") {
      plan.push({
        title: `${baseName}-storage`,
        resourceType: "Storage Account",
        location: profile.location,
        action: `Deploy ${service.label}`,
        supported: true,
      });
      return;
    }

    if (service.type === "backend_api") {
      plan.push({
        title: `${baseName}-backend-api`,
        resourceType: "App Service + Plan",
        location: profile.location,
        action: `Deploy ${service.label}`,
        supported: true,
      });
      return;
    }

    if (service.type === "database") {
      plan.push({
        title: `${baseName}-database`,
        resourceType: "Azure SQL",
        location: profile.location,
        action: `Deploy ${service.label}`,
        supported: true,
      });
      return;
    }

    if (service.type === "private_network") {
      plan.push({
        title: `${baseName}-vnet`,
        resourceType: "Virtual Network",
        location: profile.location,
        action: `Deploy ${service.label}`,
        supported: true,
      });
      return;
    }

    if (service.type === "secrets") {
      plan.push({
        title: `${baseName}-kv`,
        resourceType: "Key Vault",
        location: profile.location,
        action: `Deploy ${service.label}`,
        supported: true,
      });
      return;
    }

    if (service.type === "queue") {
      plan.push({
        title: `${baseName}-sb`,
        resourceType: "Service Bus Namespace",
        location: profile.location,
        action: `Deploy ${service.label}`,
        supported: true,
      });
      return;
    }

    if (service.type === "monitoring") {
      plan.push({
        title: `${baseName}-log`,
        resourceType: "Log Analytics Workspace",
        location: profile.location,
        action: `Deploy ${service.label}`,
        supported: true,
      });
      return;
    }

    plan.push({
      title: service.label,
      resourceType: service.cloud_service,
      location: profile.location,
      action: "Skipped by current direct deploy runner",
      supported: false,
      note: "This service is in the architecture, but direct Azure deployment is not implemented for it yet.",
    });
  });

  return plan;
}

function downloadScript(title: string, commands: string[]) {
  const blob = new Blob([`${commands.join("\n")}\n`], {
    type: "text/x-shellscript;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${slugify(title)}-ship.sh`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ProjectShipPage() {
  const { architecture } = useOutletContext<ProjectRouteContext>();
  const { updateDeploymentProfile } = useArchitectureStore();
  const [profile, setProfile] = useState<AzureDeploymentProfile>(
    architecture.azure_deployment_profile ??
      buildDefaultProfile(architecture.title),
  );
  const [preparedRun, setPreparedRun] = useState<DeploymentRun | null>(
    architecture.deployment_run ?? null,
  );
  const [preparedPlan, setPreparedPlan] = useState<AzureDeploymentPrepareResponse | null>(null);
  const [deploying, setDeploying] = useState(false);
  const [deployError, setDeployError] = useState("");
  const [deployLogs, setDeployLogs] = useState<string[]>(
    architecture.deployment_run?.command_preview ?? [],
  );

  const commands = buildCommandPreview(profile);
  const fallbackPlan = buildShipPlan(architecture.title, profile, architecture.services);
  const shipPlan: AzureDeploymentPlanItem[] =
    preparedPlan?.plan_items ??
    fallbackPlan.map((resource) => ({
      service_id: resource.title,
      title: resource.title,
      resource_type: resource.resourceType,
      location: resource.location,
      action: resource.action,
      supported: resource.supported,
      note: resource.note,
    }));
  const supportedPlan = shipPlan.filter((resource) => resource.supported);
  const skippedPlan = shipPlan.filter((resource) => !resource.supported);

  function updateField<Key extends keyof AzureDeploymentProfile>(
    key: Key,
    value: AzureDeploymentProfile[Key],
  ) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  async function handlePrepare() {
    setDeployError("");
    try {
      const response = await prepareAzureDeployment({
        project_id: architecture.request_id,
        project_title: architecture.title,
        cloud: architecture.cloud,
        profile,
        preferences: architecture.preferences,
        services: architecture.services,
      });
      setPreparedPlan(response);
      const run: DeploymentRun = {
        status: "prepared",
        summary: response.summary,
        generated_at: new Date().toISOString(),
        command_preview: response.command_preview,
      };
      setPreparedRun(run);
      setDeployLogs(response.command_preview);
      void updateDeploymentProfile(architecture.request_id, profile, run);
    } catch (error) {
      setDeployError(
        error instanceof Error
          ? error.message
          : "Unable to prepare ship plan right now.",
      );
    }
  }

  async function handleDeploy() {
    setDeploying(true);
    setDeployError("");

    const deployingRun: DeploymentRun = {
      status: "deploying",
      summary: `Deploying to resource group ${profile.resource_group}...`,
      generated_at: new Date().toISOString(),
      command_preview: commands,
    };

    setPreparedRun(deployingRun);
    void updateDeploymentProfile(architecture.request_id, profile, deployingRun);

    try {
      setPreparedPlan(null);
      const response: AzureDeploymentResponse = await deployToAzure({
        project_id: architecture.request_id,
        project_title: architecture.title,
        cloud: architecture.cloud,
        profile,
        preferences: architecture.preferences,
        services: architecture.services,
      });

      const deployedRun: DeploymentRun = {
        status: response.status === "partial" ? "ready" : "deployed",
        summary:
          response.skipped_services.length > 0
            ? `Deployment completed with skips in ${response.resource_group}.`
            : `Deployment completed for resource group ${response.resource_group}.`,
        generated_at: response.deployed_at,
        command_preview: response.logs,
      };

      setPreparedRun(deployedRun);
      setDeployLogs(response.logs);
      void updateDeploymentProfile(architecture.request_id, profile, deployedRun);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Azure deployment failed.";
      const failedRun: DeploymentRun = {
        status: "failed",
        summary: "Deployment failed. Review the logs below.",
        generated_at: new Date().toISOString(),
        command_preview: deployLogs.length > 0 ? deployLogs : commands,
      };
      setPreparedRun(failedRun);
      setDeployError(message);
      void updateDeploymentProfile(architecture.request_id, profile, failedRun);
    } finally {
      setDeploying(false);
    }
  }

  return (
    <div className="page-stack">
      <section className="quick-access-grid">
        <article className="card quick-access-card">
          <p className="eyebrow">Connection</p>
          <h3>Connect Azure tenant or SPN</h3>
          <p>Provide tenant and subscription details before preparing deployment into a resource group.</p>
        </article>

        <article className="card quick-access-card">
          <p className="eyebrow">Deploy</p>
          <h3>Ship into a resource group</h3>
          <p>Bootstrap Azure access, create the resource group, then run Terraform plan and apply for supported resources.</p>
        </article>
      </section>

      <section className="card panel">
        <div className="compact-section-head">
          <div>
            <p className="eyebrow">Ship Plan</p>
            <h2>What will be deployed</h2>
          </div>
        </div>
        <div className="service-grid">
          {shipPlan.map((resource) => (
            <article className="service-card" key={`${resource.resource_type}-${resource.title}`}>
              <div className="project-card-head">
                <p className="service-category">{resource.resource_type}</p>
                <span className={resource.supported ? "priority-pill" : "priority-pill risk"}>
                  {resource.supported ? "Supported" : "Skipped"}
                </span>
              </div>
              <h3>{resource.title}</h3>
              <p>{resource.action}</p>
              <p className="section-copy">Region: {resource.location}</p>
              {resource.note ? <p className="section-copy">{resource.note}</p> : null}
            </article>
          ))}
        </div>
      </section>

      <section className="enterprise-split">
        <article className="card panel">
          <div className="section-heading">
            <p className="eyebrow">Azure Connection</p>
            <h2>Tenant and deployment profile</h2>
          </div>

          <div className="composer-form">
            <label className="field">
              <span>Authentication mode</span>
              <div className="segmented-control">
                {([
                  ["service_principal", "Service Principal"],
                  ["tenant_user", "Azure User Sign-in"],
                ] as Array<[AzureAuthMode, string]>).map(([mode, label]) => (
                  <button
                    key={mode}
                    className={profile.auth_mode === mode ? "segment active" : "segment"}
                    onClick={() => updateField("auth_mode", mode)}
                    type="button"
                  >
                    <strong>{label}</strong>
                  </button>
                ))}
              </div>
            </label>

            <div className="control-grid">
              <label className="field">
                <span>Tenant ID</span>
                <input
                  className="text-input"
                  onChange={(event) => updateField("tenant_id", event.target.value)}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  value={profile.tenant_id}
                />
              </label>
              <label className="field">
                <span>Subscription ID</span>
                <input
                  className="text-input"
                  onChange={(event) =>
                    updateField("subscription_id", event.target.value)
                  }
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  value={profile.subscription_id}
                />
              </label>
            </div>

            {profile.auth_mode === "service_principal" ? (
              <div className="control-grid">
                <label className="field">
                  <span>Client ID</span>
                  <input
                    className="text-input"
                    onChange={(event) => updateField("client_id", event.target.value)}
                    placeholder="Application (client) ID"
                    value={profile.client_id ?? ""}
                  />
                </label>
                <label className="field">
                  <span>Client Secret</span>
                  <input
                    className="text-input"
                    onChange={(event) =>
                      updateField("client_secret", event.target.value)
                    }
                    placeholder="Stored locally for the current project"
                    type="password"
                    value={profile.client_secret ?? ""}
                  />
                </label>
              </div>
            ) : null}

            <div className="control-grid">
              <label className="field">
                <span>Resource Group</span>
                <input
                  className="text-input"
                  onChange={(event) =>
                    updateField("resource_group", event.target.value)
                  }
                  value={profile.resource_group}
                />
              </label>
              <label className="field">
                <span>Azure Region</span>
                <input
                  className="text-input"
                  onChange={(event) => updateField("location", event.target.value)}
                  value={profile.location}
                />
              </label>
            </div>

            <label className="field">
              <span>Deployment Name</span>
              <input
                className="text-input"
                onChange={(event) => updateField("deployment_name", event.target.value)}
                value={profile.deployment_name}
              />
            </label>

            <div className="action-row">
              <button className="primary-button" onClick={() => void handlePrepare()} type="button">
                Prepare Ship Plan
              </button>
              <button
                className="primary-button"
                disabled={deploying}
                onClick={handleDeploy}
                type="button"
              >
                {deploying ? "Deploying..." : "Deploy to Azure"}
              </button>
              <button
                className="secondary-button"
                onClick={() => downloadScript(architecture.title, commands)}
                type="button"
              >
                Download deploy script
              </button>
            </div>
          </div>
        </article>

        <article className="card panel">
          <div className="section-heading">
            <p className="eyebrow">Ship Plan</p>
            <h2>Azure resource group deployment</h2>
          </div>

          <div className="studio-helper-stack compact">
            <article className="studio-helper-card">
              <strong>Status</strong>
              <p>{preparedRun?.summary ?? "Connect Azure details and prepare a deployment run."}</p>
            </article>
            <article className="studio-helper-card">
              <strong>Target resource group</strong>
              <p>{profile.resource_group}</p>
            </article>
            <article className="studio-helper-card">
              <strong>IaC readiness</strong>
              <p>
                {architecture.iac_template
                  ? "Code output is available and will continue to regenerate from architecture changes."
                  : "Deployment can run for supported services even if code output is not attached."}
              </p>
            </article>
            <article className="studio-helper-card">
              <strong>Plan summary</strong>
              <p>{supportedPlan.length} supported resources, {skippedPlan.length} skipped.</p>
            </article>
          </div>

          {preparedRun?.status === "prepared" || preparedRun?.status === "deploying" || preparedRun?.status === "deployed" || preparedRun?.status === "ready" ? (
            <div className="service-grid">
              {shipPlan.map((resource) => (
                <article className="service-card" key={`prepared-${resource.resource_type}-${resource.title}`}>
                  <div className="project-card-head">
                    <p className="service-category">{resource.resource_type}</p>
                    <span className={resource.supported ? "priority-pill" : "priority-pill risk"}>
                      {resource.supported ? "Will deploy" : "Will skip"}
                    </span>
                  </div>
                  <h3>{resource.title}</h3>
                  <p>{resource.action}</p>
                  <p className="section-copy">Region: {resource.location}</p>
                  {resource.note ? <p className="section-copy">{resource.note}</p> : null}
                </article>
              ))}
            </div>
          ) : null}

          {deployError ? <p className="error-banner">{deployError}</p> : null}

          <pre className="code-block">
            <code>{deployLogs.length > 0 ? deployLogs.join("\n") : commands.join("\n")}</code>
          </pre>
        </article>
      </section>
    </div>
  );
}
