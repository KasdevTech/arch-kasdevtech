import { Link } from "react-router-dom";
import type { ArchitectureResponse } from "../types";
import { VALUE_LABELS } from "../data/catalog";

interface ProjectCardProps {
  architecture: ArchitectureResponse;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ProjectCard({ architecture }: ProjectCardProps) {
  return (
    <article className="card project-card">
      <div className="project-card-head">
        <div>
          <p className="eyebrow">Architecture</p>
          <h3>{architecture.title}</h3>
        </div>
        <span className="cloud-pill">{architecture.cloud.toUpperCase()}</span>
      </div>

      <p className="project-summary">{architecture.summary}</p>

      <div className="pill-row">
        {architecture.priorities.slice(0, 3).map((priority) => (
          <span className="priority-pill" key={priority}>
            {VALUE_LABELS[priority] ?? priority}
          </span>
        ))}
        {architecture.preferences.multi_region ? (
          <span className="profile-pill">Multi-region</span>
        ) : null}
        {architecture.iac_template ? (
          <span className="profile-pill">IaC ready</span>
        ) : null}
      </div>

      <div className="project-meta">
        <div>
          <span>Updated</span>
          <strong>{formatDate(architecture.created_at)}</strong>
        </div>
        <div>
          <span>Services</span>
          <strong>{architecture.services.length}</strong>
        </div>
        <div>
          <span>Compliance</span>
          <strong>
            {architecture.preferences.compliance_frameworks.length > 0
              ? architecture.preferences.compliance_frameworks.length
              : "None"}
          </strong>
        </div>
      </div>

      <Link
        className="inline-link"
        to={`/app/projects/${architecture.request_id}/overview`}
      >
        Open project
      </Link>
    </article>
  );
}
