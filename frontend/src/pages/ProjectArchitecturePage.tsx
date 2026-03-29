import { useOutletContext } from "react-router-dom";
import { ArchitectureBoard } from "../components/ArchitectureBoard";
import { useArchitectureStore } from "../context/ArchitectureStore";
import type { ProjectRouteContext } from "./ArchitectureDetailPage";

export function ProjectArchitecturePage() {
  const { architecture } = useOutletContext<ProjectRouteContext>();
  const { updateCanvasLayout } = useArchitectureStore();

  return (
    <div className="page-stack">
      <section className="card panel">
        <div className="section-heading">
          <p className="eyebrow">Architecture View</p>
          <h2>Real-time visual architecture canvas</h2>
        </div>
        <p className="section-copy">
          This page now renders a native SVG architecture diagram with service
          imagery and connection paths directly inside the product, instead of
          relying on Mermaid.
        </p>
      </section>

      <ArchitectureBoard
        architecture={architecture}
        onLayoutChange={(layout) =>
          updateCanvasLayout(architecture.request_id, layout)
        }
      />
    </div>
  );
}
