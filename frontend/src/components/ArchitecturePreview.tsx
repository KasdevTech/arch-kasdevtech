import { useEffect, useId, useState } from "react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  securityLevel: "loose",
  theme: "base",
  themeVariables: {
    primaryColor: "#f8fafc",
    primaryTextColor: "#0f172a",
    primaryBorderColor: "#0f172a",
    lineColor: "#475569",
    fontFamily: "Manrope, sans-serif",
    tertiaryColor: "#f8fafc",
  },
  flowchart: {
    curve: "basis",
    useMaxWidth: true,
    htmlLabels: true,
  },
});

interface ArchitecturePreviewProps {
  mermaidDefinition: string;
  title: string;
}

export function ArchitecturePreview({
  mermaidDefinition,
  title,
}: ArchitecturePreviewProps) {
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");
  const instanceId = useId().replace(/:/g, "");

  useEffect(() => {
    let active = true;

    async function renderDiagram() {
      if (!mermaidDefinition) {
        setSvg("");
        setError("");
        return;
      }

      try {
        const renderKey = `mermaid-${instanceId}-${Date.now()}`;
        const { svg: nextSvg } = await mermaid.render(renderKey, mermaidDefinition);
        if (active) {
          setSvg(nextSvg);
          setError("");
        }
      } catch (renderError) {
        if (active) {
          setSvg("");
          setError(
            renderError instanceof Error
              ? renderError.message
              : "Unable to render diagram.",
          );
        }
      }
    }

    renderDiagram();

    return () => {
      active = false;
    };
  }, [instanceId, mermaidDefinition]);

  return (
    <section className="card diagram-card">
      <div className="section-heading">
        <p className="eyebrow">Diagram</p>
        <h2>{title}</h2>
      </div>
      {error ? (
        <div className="empty-state subtle">
          <p>Mermaid render error</p>
          <span>{error}</span>
        </div>
      ) : svg ? (
        <div
          className="diagram-frame"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div className="empty-state subtle">
          <p>Rendering your architecture diagram...</p>
        </div>
      )}
    </section>
  );
}
