import { useEffect, useState, type FormEvent } from "react";
import type {
  ArchitecturePreferences,
  ArchitectureRequest,
  CloudProvider,
  ComplianceFramework,
} from "../types";
import {
  CLOUD_OPTIONS,
  COMPLIANCE_OPTIONS,
  DEFAULT_PREFERENCES,
  DEFAULT_PROMPT,
  ENVIRONMENT_OPTIONS,
  QUICK_PROMPTS,
} from "../data/catalog";

interface ArchitectureComposerProps {
  error: string;
  initialRequest?: ArchitectureRequest;
  loading: boolean;
  mode?: "create" | "edit";
  onGenerate: (payload: ArchitectureRequest) => Promise<void>;
  presetRequest?: ArchitectureRequest;
}

export function ArchitectureComposer({
  error,
  initialRequest,
  loading,
  mode = "create",
  onGenerate,
  presetRequest,
}: ArchitectureComposerProps) {
  const [prompt, setPrompt] = useState(initialRequest?.prompt ?? DEFAULT_PROMPT);
  const [cloud, setCloud] = useState<CloudProvider>(
    initialRequest?.cloud ?? "azure",
  );
  const [includeIac, setIncludeIac] = useState(
    initialRequest?.include_iac ?? true,
  );
  const [preferences, setPreferences] = useState<ArchitecturePreferences>(
    initialRequest?.preferences ?? DEFAULT_PREFERENCES,
  );

  const cloudCopy = CLOUD_OPTIONS.find((option) => option.value === cloud);

  useEffect(() => {
    if (!presetRequest) {
      return;
    }

    setPrompt(presetRequest.prompt);
    setCloud(presetRequest.cloud);
    setIncludeIac(presetRequest.include_iac);
    setPreferences(presetRequest.preferences);
  }, [presetRequest]);

  function updatePreference<K extends keyof ArchitecturePreferences>(
    key: K,
    value: ArchitecturePreferences[K],
  ) {
    setPreferences((current) => ({ ...current, [key]: value }));
  }

  function toggleEnvironment(environment: string) {
    setPreferences((current) => {
      const environments = current.environments.includes(environment)
        ? current.environments.filter((item) => item !== environment)
        : [...current.environments, environment];

      return {
        ...current,
        environments: environments.length > 0 ? environments : current.environments,
      };
    });
  }

  function toggleCompliance(framework: ComplianceFramework) {
    setPreferences((current) => ({
      ...current,
      compliance_frameworks: current.compliance_frameworks.includes(framework)
        ? current.compliance_frameworks.filter((item) => item !== framework)
        : [...current.compliance_frameworks, framework],
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onGenerate({
      prompt,
      cloud,
      include_iac: includeIac,
      preferences,
    });
  }

  return (
    <section className="card panel">
      <div className="section-heading">
        <p className="eyebrow">Workload Intake</p>
        <h2>
          {mode === "edit"
            ? "Rename or update project"
            : "Build a new architecture project"}
        </h2>
      </div>

      <form className="composer-form" onSubmit={handleSubmit}>
        <div className="control-grid">
          <label className="field">
            <span>Project name</span>
            <input
              className="text-input"
              value={preferences.workload_name ?? ""}
              onChange={(event) =>
                updatePreference("workload_name", event.target.value)
              }
              placeholder="Customer Platform"
            />
          </label>

          <label className="field">
            <span>Tenancy model</span>
            <select
              className="select-input"
              value={preferences.tenancy}
              onChange={(event) =>
                updatePreference(
                  "tenancy",
                  event.target.value as ArchitecturePreferences["tenancy"],
                )
              }
            >
              <option value="single_tenant">Single tenant</option>
              <option value="pooled_multi_tenant">Pooled multi-tenant</option>
            </select>
          </label>
        </div>

        <label className="field">
          <span>Workload brief</span>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={8}
            placeholder="Describe the platform you want to build..."
          />
        </label>

        <div className="quick-prompts">
          {QUICK_PROMPTS.map((quickPrompt) => (
            <button
              type="button"
              key={quickPrompt}
              className="quick-chip"
              onClick={() => setPrompt(quickPrompt)}
            >
              {quickPrompt}
            </button>
          ))}
        </div>

        <div className="field">
          <span>Cloud provider</span>
          <div className="segmented-control">
            {CLOUD_OPTIONS.map((option) => (
              <button
                type="button"
                key={option.value}
                className={option.value === cloud ? "segment active" : "segment"}
                onClick={() => setCloud(option.value)}
              >
                <strong>{option.label}</strong>
                <small>{option.blurb}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="control-grid">
          <label className="field">
            <span>User scale</span>
            <select
              className="select-input"
              value={preferences.user_scale}
              onChange={(event) =>
                updatePreference(
                  "user_scale",
                  event.target.value as ArchitecturePreferences["user_scale"],
                )
              }
            >
              <option value="team">Team</option>
              <option value="business">Business</option>
              <option value="internet_scale">Internet scale</option>
            </select>
          </label>

          <label className="field">
            <span>Availability target</span>
            <select
              className="select-input"
              value={preferences.availability_tier}
              onChange={(event) =>
                updatePreference(
                  "availability_tier",
                  event.target.value as ArchitecturePreferences["availability_tier"],
                )
              }
            >
              <option value="standard">Standard</option>
              <option value="high_availability">High availability</option>
              <option value="mission_critical">Mission critical</option>
            </select>
          </label>

          <label className="field">
            <span>Data sensitivity</span>
            <select
              className="select-input"
              value={preferences.data_sensitivity}
              onChange={(event) =>
                updatePreference(
                  "data_sensitivity",
                  event.target.value as ArchitecturePreferences["data_sensitivity"],
                )
              }
            >
              <option value="internal">Internal</option>
              <option value="confidential">Confidential</option>
              <option value="regulated">Regulated</option>
            </select>
          </label>

          <label className="field">
            <span>Network exposure</span>
            <select
              className="select-input"
              value={preferences.network_exposure}
              onChange={(event) =>
                updatePreference(
                  "network_exposure",
                  event.target.value as ArchitecturePreferences["network_exposure"],
                )
              }
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </label>
        </div>

        <div className="field">
          <span>Deployment environments</span>
          <div className="chip-row">
            {ENVIRONMENT_OPTIONS.map((environment) => (
              <button
                type="button"
                key={environment}
                className={
                  preferences.environments.includes(environment)
                    ? "filter-chip active"
                    : "filter-chip"
                }
                onClick={() => toggleEnvironment(environment)}
              >
                {environment}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span>Compliance targets</span>
          <div className="chip-row">
            {COMPLIANCE_OPTIONS.map((framework) => (
              <button
                type="button"
                key={framework.value}
                className={
                  preferences.compliance_frameworks.includes(framework.value)
                    ? "filter-chip active"
                    : "filter-chip"
                }
                onClick={() => toggleCompliance(framework.value)}
              >
                {framework.label}
              </button>
            ))}
          </div>
        </div>

        <div className="toggle-grid">
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={preferences.multi_region}
              onChange={(event) =>
                updatePreference("multi_region", event.target.checked)
              }
            />
            <span>Multi-region architecture</span>
          </label>

          <label className="toggle-row">
            <input
              type="checkbox"
              checked={preferences.disaster_recovery}
              onChange={(event) =>
                updatePreference("disaster_recovery", event.target.checked)
              }
            />
            <span>Include disaster recovery posture</span>
          </label>

          <label className="toggle-row">
            <input
              type="checkbox"
              checked={includeIac}
              onChange={(event) => setIncludeIac(event.target.checked)}
            />
            <span>Include Terraform starter output</span>
          </label>
        </div>

        {cloudCopy ? (
          <p className="context-note">
            Current mapping mode: <strong>{cloudCopy.label}</strong>.{" "}
            {cloudCopy.blurb}
          </p>
        ) : null}

        {error ? <p className="error-banner">{error}</p> : null}

        <button className="primary-button" type="submit" disabled={loading}>
          {loading
            ? mode === "edit"
              ? "Updating architecture..."
              : "Generating architecture..."
            : mode === "edit"
              ? "Save changes"
              : "Generate architecture"}
        </button>
      </form>
    </section>
  );
}
