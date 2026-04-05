import type { ArchitectureResponse } from "../types";

function extractComponentBlocks(template: string) {
  const matches = Array.from(
    template.matchAll(
      /# --- Component: ([^|]+)\|\s*([^\n]+) ---\n([\s\S]*?)(?=\n# --- Component:|\n# --- Unsupported components|\n# Resource group bootstrap|\s*$)/g,
    ),
  );

  return matches.map((match) => ({
    id: match[1].trim(),
    title: match[2].trim(),
    code: match[3].trim(),
  }));
}

function extractFoundation(template: string) {
  const marker = "\n# --- Component:";
  const firstComponentIndex = template.indexOf(marker);
  if (firstComponentIndex === -1) {
    return template.trim();
  }
  return template.slice(0, firstComponentIndex).trim();
}

export function TerraformModulesPage({
  architecture,
}: {
  architecture: ArchitectureResponse;
}) {
  if (!architecture.iac_template) {
    return (
      <section className="card empty-card">
        <p className="eyebrow">Code</p>
        <h2>This project was generated without infrastructure code output.</h2>
        <p>
          Generate a new architecture with the Terraform option enabled to see
          per-component IaC modules on this page.
        </p>
      </section>
    );
  }

  const foundation = extractFoundation(architecture.iac_template);
  const components = extractComponentBlocks(architecture.iac_template);

  return (
    <div className="page-stack">
      <section className="card panel">
          <div className="section-heading">
            <p className="eyebrow">Code</p>
            <h2>Deployable infrastructure code</h2>
          </div>
          <p className="section-copy">
            This page shows the Terraform bundle that Ship applies for supported
            Azure resources, with each generated component separated for review.
          </p>
        </section>

      <section className="terraform-grid">
        <article className="card terraform-card">
          <div className="section-heading">
            <p className="eyebrow">Foundation</p>
            <h2>Providers and platform baseline</h2>
          </div>
          <pre className="code-block">
            <code>{foundation}</code>
          </pre>
        </article>

        {components.map((component) => {
          const service = architecture.services.find(
            (item) => item.id === component.id,
          );

          return (
            <article key={component.id} className="card terraform-card">
              <div className="section-heading">
                <p className="eyebrow">Component</p>
                <h2>{service?.cloud_service ?? component.title}</h2>
              </div>
              <p className="section-copy">
                {service?.rationale ?? "Deployable Terraform for this component."}
              </p>
              <pre className="code-block">
                <code>{component.code}</code>
              </pre>
            </article>
          );
        })}
      </section>
    </div>
  );
}
