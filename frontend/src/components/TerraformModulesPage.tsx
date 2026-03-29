import type { ArchitectureResponse } from "../types";

function extractModuleBlocks(template: string) {
  const matches = Array.from(
    template.matchAll(/module "([^"]+)" \{[\s\S]*?\n\}/g),
  );

  return matches.map((match) => ({
    id: match[1],
    code: match[0],
  }));
}

function extractFoundation(template: string) {
  const firstModuleIndex = template.indexOf('\nmodule "');
  if (firstModuleIndex === -1) {
    return template.trim();
  }
  return template.slice(0, firstModuleIndex).trim();
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
  const modules = extractModuleBlocks(architecture.iac_template);

  return (
    <div className="page-stack">
      <section className="card panel">
        <div className="section-heading">
          <p className="eyebrow">Code</p>
          <h2>Per-component infrastructure page</h2>
        </div>
        <p className="section-copy">
          Infrastructure code now lives on its own route, and each mapped
          component gets its own module section so the implementation view feels
          like a real product page rather than a giant block at the bottom of
          the report.
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

        {modules.map((module) => {
          const service = architecture.services.find(
            (item) => item.id === module.id,
          );

          return (
            <article key={module.id} className="card terraform-card">
              <div className="section-heading">
                <p className="eyebrow">Component Module</p>
                <h2>{service?.cloud_service ?? module.id}</h2>
              </div>
              <p className="section-copy">
                {service?.rationale ?? "Infrastructure module for this component."}
              </p>
              <pre className="code-block">
                <code>{module.code}</code>
              </pre>
            </article>
          );
        })}
      </section>
    </div>
  );
}
