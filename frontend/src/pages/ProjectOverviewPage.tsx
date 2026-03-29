import { Link } from "react-router-dom";
import { useOutletContext } from "react-router-dom";
import { ArchitectureReport } from "../components/ArchitectureReport";
import type { ProjectRouteContext } from "./ArchitectureDetailPage";

export function ProjectOverviewPage() {
  const { architecture, onDelete } = useOutletContext<ProjectRouteContext>();

  return (
    <div className="page-stack">
      <section className="quick-access-grid">
        <article className="card quick-access-card">
          <p className="eyebrow">Architecture</p>
          <h3>Open visual diagram</h3>
          <p>
            See the generated diagram plus the fit-to-page cloud board with
            Azure-style imagery.
          </p>
          <Link className="inline-link" to="../architecture">
            Go to Architecture page
          </Link>
        </article>

        <article className="card quick-access-card">
          <p className="eyebrow">Code</p>
          <h3>Open infrastructure code</h3>
          <p>
            Review provider baseline and per-component Terraform modules on a
            dedicated code page.
          </p>
          <Link className="inline-link" to="../code">
            Go to Code page
          </Link>
        </article>
      </section>

      <ArchitectureReport architecture={architecture} onDelete={onDelete} />
    </div>
  );
}
