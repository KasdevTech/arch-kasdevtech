from __future__ import annotations

from app.models import Connection, ServiceMapping


CATEGORY_CLASS_NAMES = {
    "edge": "edge",
    "presentation": "presentation",
    "identity": "identity",
    "api": "api",
    "compute": "compute",
    "data": "data",
    "cache": "cache",
    "messaging": "messaging",
    "storage": "storage",
    "security": "security",
    "network": "network",
    "operations": "operations",
}


class MermaidDiagramService:
    def render(self, services: list[ServiceMapping], connections: list[Connection]) -> str:
        lines = [
            "flowchart LR",
            "  classDef actor fill:#0f172a,stroke:#1d4ed8,color:#f8fafc,stroke-width:1.5px;",
            "  classDef edge fill:#fff4d6,stroke:#b7791f,color:#4a2c04;",
            "  classDef presentation fill:#e7fff7,stroke:#0f766e,color:#083344;",
            "  classDef identity fill:#fef2f2,stroke:#b91c1c,color:#7f1d1d;",
            "  classDef api fill:#eff6ff,stroke:#2563eb,color:#1e3a8a;",
            "  classDef compute fill:#edf2ff,stroke:#4f46e5,color:#312e81;",
            "  classDef data fill:#ecfccb,stroke:#4d7c0f,color:#365314;",
            "  classDef cache fill:#fff1f2,stroke:#e11d48,color:#881337;",
            "  classDef messaging fill:#fdf4ff,stroke:#a21caf,color:#701a75;",
            "  classDef storage fill:#f0fdfa,stroke:#0f766e,color:#134e4a;",
            "  classDef security fill:#fff7ed,stroke:#c2410c,color:#7c2d12;",
            "  classDef network fill:#eef2ff,stroke:#4338ca,color:#312e81;",
            "  classDef operations fill:#f8fafc,stroke:#475569,color:#0f172a;",
            '  users["Users"]:::actor',
        ]

        for service in services:
            node_id = service.id
            label = self._format_label(service.cloud_service, service.label)
            class_name = CATEGORY_CLASS_NAMES[service.category]
            lines.append(f'  {node_id}["{label}"]:::{class_name}')

        for connection in connections:
            arrow = "-.->" if connection.dashed else "-->"
            if connection.label:
                lines.append(
                    f'  {connection.source} {arrow}|{self._escape_label(connection.label)}| {connection.target}',
                )
            else:
                lines.append(f"  {connection.source} {arrow} {connection.target}")

        return "\n".join(lines)

    def _format_label(self, primary: str, secondary: str) -> str:
        safe_primary = primary.replace('"', '\\"')
        safe_secondary = secondary.replace('"', '\\"')
        return f"{safe_primary}<br/><small>{safe_secondary}</small>"

    def _escape_label(self, label: str) -> str:
        return label.replace("|", "/").replace('"', '\\"')
