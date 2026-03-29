import { Link } from "react-router-dom";

export function ChatPage() {
  return (
    <section className="card panel">
      <div className="section-heading">
        <p className="eyebrow">Architect Chat</p>
        <h2>Use the floating assistant in the bottom-right corner</h2>
      </div>
      <p className="section-copy">
        Chat mode now lives as a floating chatbot across the frontend, so you
        can ask for architectures without leaving the page you are working on.
      </p>
      <ul className="detail-list">
        <li>Click the bottom-right assistant launcher.</li>
        <li>Describe the workload naturally.</li>
        <li>The architecture will render directly inside the chat panel.</li>
        <li>The generated project is still saved into your library automatically.</li>
      </ul>
      <div className="action-row">
        <Link className="button-link secondary" to="/app/studio">
          Open Studio
        </Link>
        <Link className="button-link secondary" to="/app/projects">
          View Projects
        </Link>
      </div>
    </section>
  );
}
