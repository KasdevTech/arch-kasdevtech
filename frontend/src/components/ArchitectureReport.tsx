import { useDeferredValue, useState } from "react";
import { VALUE_LABELS } from "../data/catalog";
import type { ArchitectureResponse, ProjectHistoryResponse } from "../types";

interface ArchitectureReportProps {
  architecture: ArchitectureResponse;
  history?: ProjectHistoryResponse | null;
  restoringVersionId?: string | null;
  onRestoreVersion?: (versionId: string) => Promise<void>;
  onDelete?: () => void | Promise<void>;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ArchitectureReport({
  architecture,
  history,
  restoringVersionId,
  onRestoreVersion,
  onDelete,
}: ArchitectureReportProps) {
  const deferredArchitecture = useDeferredValue(architecture);
  const confidenceScore = deferredArchitecture.confidence_score ?? 0;
  const classificationConfidence =
    deferredArchitecture.classification_confidence ?? 0;
  const retrievalMatches = deferredArchitecture.retrieval_matches ?? [];
  const validatorFindings = deferredArchitecture.validator_findings ?? [];
  const [exportStatus, setExportStatus] = useState("");

  async function handleCopyMermaid() {
    await navigator.clipboard.writeText(deferredArchitecture.mermaid);
    setExportStatus("Mermaid copied to clipboard.");
  }

  function handleDownloadJson() {
    const blob = new Blob([JSON.stringify(deferredArchitecture, null, 2)], {
      type: "application/json",
    });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `${deferredArchitecture.cloud}-enterprise-architecture.json`;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
    setExportStatus("Architecture JSON downloaded.");
  }

  function formatKey(value: string) {
    return value.replace(/_/g, " ");
  }

  return (
    <div className="page-stack">
      <section className="card report-hero">
        <div className="summary-head">
          <div>
            <p className="eyebrow">Architecture Pack</p>
            <h2>{deferredArchitecture.title}</h2>
            <p className="summary-text">{deferredArchitecture.summary}</p>
          </div>
          <div className="report-side">
            <span className="cloud-pill">
              {deferredArchitecture.cloud.toUpperCase()}
            </span>
            <small>Updated {formatDate(deferredArchitecture.created_at)}</small>
          </div>
        </div>

        <div className="pill-row">
          {deferredArchitecture.priorities.map((priority) => (
            <span className="priority-pill" key={priority}>
              {VALUE_LABELS[priority] ?? priority}
            </span>
          ))}
        </div>

        <div className="pill-row">
          <span className="profile-pill">
            {VALUE_LABELS[deferredArchitecture.preferences.availability_tier]}
          </span>
          <span className="profile-pill">
            {VALUE_LABELS[deferredArchitecture.preferences.network_exposure]}
          </span>
          <span className="profile-pill">
            {VALUE_LABELS[deferredArchitecture.preferences.user_scale]}
          </span>
          <span className="profile-pill">
            {VALUE_LABELS[deferredArchitecture.preferences.tenancy]}
          </span>
        </div>

        <div className="action-row">
          <button
            type="button"
            className="secondary-button"
            onClick={handleCopyMermaid}
          >
            Copy Mermaid
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={handleDownloadJson}
          >
            Download JSON
          </button>
          {onDelete ? (
            <button type="button" className="ghost-button" onClick={onDelete}>
              Remove Project
            </button>
          ) : null}
        </div>

        {exportStatus ? <p className="context-note">{exportStatus}</p> : null}
      </section>

      <section className="report-grid">
        <article className="card profile-card">
          <div className="section-heading">
            <p className="eyebrow">Profile</p>
            <h2>Workload posture</h2>
          </div>
          <div className="definition-list">
            <div>
              <span>Environments</span>
              <strong>
                {deferredArchitecture.preferences.environments.join(", ")}
              </strong>
            </div>
            <div>
              <span>Compliance</span>
              <strong>
                {deferredArchitecture.preferences.compliance_frameworks.length > 0
                  ? deferredArchitecture.preferences.compliance_frameworks
                      .map((item) => VALUE_LABELS[item] ?? item)
                      .join(", ")
                  : "None selected"}
              </strong>
            </div>
            <div>
              <span>Data sensitivity</span>
              <strong>
                {VALUE_LABELS[deferredArchitecture.preferences.data_sensitivity]}
              </strong>
            </div>
            <div>
              <span>Regional strategy</span>
              <strong>
                {deferredArchitecture.preferences.multi_region
                  ? "Multi-region"
                  : "Single region"}
              </strong>
            </div>
          </div>
        </article>

        <article className="card profile-card">
          <div className="section-heading">
            <p className="eyebrow">Quality</p>
            <h2>Architecture confidence</h2>
          </div>
          <div className="definition-list">
            <div>
              <span>Confidence score</span>
              <strong>{Math.round(confidenceScore * 100)}%</strong>
            </div>
            <div>
              <span>Matched pattern</span>
              <strong>{deferredArchitecture.matched_pattern ?? "No direct pattern match"}</strong>
            </div>
            <div>
              <span>Classifier confidence</span>
              <strong>{Math.round(classificationConfidence * 100)}%</strong>
            </div>
            <div>
              <span>Validation findings</span>
              <strong>{validatorFindings.length}</strong>
            </div>
          </div>
        </article>

        <article className="card profile-card">
          <div className="section-heading">
            <p className="eyebrow">Highlights</p>
            <h2>Topology summary</h2>
          </div>
          <ul className="detail-list">
            {deferredArchitecture.topology_highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="card">
        <div className="section-heading">
          <p className="eyebrow">Versions</p>
          <h2>Project history</h2>
        </div>
        {history && history.versions.length > 0 ? (
          <div className="content-stack">
            {history.versions.slice(0, 8).map((version) => (
              <article key={version.version_id} className="narrative-block">
                <div className="project-card-head">
                  <h3>Version {version.version_number}</h3>
                  {onRestoreVersion ? (
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={restoringVersionId === version.version_id}
                      onClick={() => onRestoreVersion(version.version_id)}
                    >
                      {restoringVersionId === version.version_id ? "Restoring..." : "Restore"}
                    </button>
                  ) : null}
                </div>
                <p>{version.change_note ?? version.summary}</p>
                <p className="section-copy">Saved {formatDate(version.saved_at)}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="section-copy">
            Version history will appear here as the project evolves.
          </p>
        )}
      </section>

      <section className="card">
        <div className="section-heading">
          <p className="eyebrow">Pattern Ranking</p>
          <h2>Closest solution matches</h2>
        </div>
        {retrievalMatches.length > 0 ? (
          <div className="content-stack">
            {retrievalMatches.map((match) => (
              <article key={match.pattern_id} className="narrative-block">
                <h3>{match.title}</h3>
                <p>
                  Domain: {formatKey(match.domain)}. Archetype:{" "}
                  {formatKey(match.archetype)}.
                </p>
                <p>Similarity score: {Math.round(match.score * 100)}%</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="section-copy">
            No strong reference pattern was matched for this architecture prompt.
          </p>
        )}
      </section>

      <section className="card">
        <div className="section-heading">
          <p className="eyebrow">Validation</p>
          <h2>Quality findings</h2>
        </div>
        {validatorFindings.length > 0 ? (
          <div className="content-stack">
            {validatorFindings.map((finding, index) => (
              <article key={`${finding.severity}-${index}`} className="narrative-block">
                <h3>{finding.severity.toUpperCase()}</h3>
                <p>{finding.message}</p>
                <p>{finding.recommendation}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="section-copy">
            No material validation gaps were detected for the generated architecture pattern.
          </p>
        )}
      </section>

      <section className="card">
        <div className="section-heading">
          <p className="eyebrow">Mapped Services</p>
          <h2>Cloud components</h2>
        </div>
        <div className="service-grid">
          {deferredArchitecture.services.map((service) => (
            <article key={service.id} className="service-card">
              <span className={`service-category ${service.category}`}>
                {service.category}
              </span>
              <h3>{service.cloud_service}</h3>
              <p className="service-label">{service.label}</p>
              <p>{service.rationale}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="section-heading">
          <p className="eyebrow">Narrative</p>
          <h2>Architect notes</h2>
        </div>
        <div className="content-stack">
          {deferredArchitecture.explanation_sections.map((section) => (
            <article key={section.title} className="narrative-block">
              <h3>{section.title}</h3>
              <p>{section.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card split-card enterprise-split">
        <div>
          <div className="section-heading">
            <p className="eyebrow">Security</p>
            <h2>Control posture</h2>
          </div>
          <ul className="detail-list">
            {deferredArchitecture.security_controls.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div>
          <div className="section-heading">
            <p className="eyebrow">Resilience</p>
            <h2>Continuity notes</h2>
          </div>
          <ul className="detail-list">
            {deferredArchitecture.resilience_notes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="card split-card enterprise-split">
        <div>
          <div className="section-heading">
            <p className="eyebrow">Operations</p>
            <h2>Operating model</h2>
          </div>
          <ul className="detail-list">
            {deferredArchitecture.operational_controls.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div>
          <div className="section-heading">
            <p className="eyebrow">Risk Review</p>
            <h2>Architecture risks</h2>
          </div>
          <ul className="detail-list">
            {deferredArchitecture.risk_flags.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="card split-card enterprise-split">
        <div>
          <div className="section-heading">
            <p className="eyebrow">Assumptions</p>
            <h2>Inferred decisions</h2>
          </div>
          <ul className="detail-list">
            {deferredArchitecture.assumptions.map((assumption) => (
              <li key={assumption}>{assumption}</li>
            ))}
          </ul>
        </div>

        <div>
          <div className="section-heading">
            <p className="eyebrow">Next Steps</p>
            <h2>Production hardening path</h2>
          </div>
          <ul className="detail-list">
            {deferredArchitecture.recommended_next_steps.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

    </div>
  );
}
