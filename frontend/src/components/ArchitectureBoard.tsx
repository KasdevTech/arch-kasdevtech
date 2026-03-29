import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type {
  ArchitectureResponse,
  CanvasLayout,
  Connection,
  ServiceMapping,
} from "../types";

type LaneDefinition = {
  id: string;
  title: string;
  categories: string[];
};

type NodeLayoutPreset = Record<string, { x: number; y: number }>;

type DiagramNode = {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  x: number;
  y: number;
  width: number;
  height: number;
  image: string;
  locked?: boolean;
};

type DragState = {
  nodeId: string;
  offsetX: number;
  offsetY: number;
};

const NODE_WIDTH = 230;
const NODE_HEIGHT = 96;
const VIEWBOX_WIDTH = 1280;
const VIEWBOX_HEIGHT = 820;

const USER_COLUMN_X = 40;

const DEFAULT_LANES: LaneDefinition[] = [
  {
    id: "experience",
    title: "Experience",
    categories: ["edge", "presentation", "identity"],
  },
  {
    id: "application",
    title: "Application",
    categories: ["api", "compute", "integration", "ai", "cache", "messaging"],
  },
  {
    id: "data",
    title: "Data",
    categories: ["data", "storage", "analytics"],
  },
  {
    id: "governance",
    title: "Guardrails",
    categories: ["security", "governance", "control", "network", "operations"],
  },
];

const ARCHETYPE_LANES: Record<string, LaneDefinition[]> = {
  ai_security_and_compliance: [
    {
      id: "surface",
      title: "Access",
      categories: ["edge", "presentation", "identity", "api"],
    },
    {
      id: "assessment",
      title: "Assess",
      categories: ["compute", "control", "governance", "security"],
    },
    {
      id: "evidence",
      title: "Evidence",
      categories: ["data", "storage", "analytics", "integration"],
    },
    {
      id: "operations",
      title: "Operate",
      categories: ["network", "operations", "ai", "messaging"],
    },
  ],
  ai_application_stack: [
    {
      id: "experience",
      title: "Experience",
      categories: ["edge", "presentation", "identity", "api"],
    },
    {
      id: "orchestration",
      title: "Orchestration",
      categories: ["compute", "integration", "messaging"],
    },
    {
      id: "intelligence",
      title: "Intelligence",
      categories: ["ai", "control", "governance"],
    },
    {
      id: "knowledge",
      title: "Knowledge",
      categories: ["search", "data", "storage", "analytics"],
    },
  ],
  data_processing_platform: [
    {
      id: "ingestion",
      title: "Ingestion",
      categories: ["integration", "api", "messaging"],
    },
    {
      id: "processing",
      title: "Processing",
      categories: ["compute", "ai"],
    },
    {
      id: "data",
      title: "Data",
      categories: ["storage", "data", "cache"],
    },
    {
      id: "consumption",
      title: "Consumption",
      categories: ["analytics", "presentation", "operations"],
    },
  ],
};

const ARCHETYPE_NODE_LAYOUTS: Record<string, NodeLayoutPreset> = {
  ai_security_and_compliance: {
    users: { x: 22, y: 330 },
    waf: { x: 180, y: 90 },
    frontend: { x: 180, y: 250 },
    authentication: { x: 180, y: 410 },
    api_gateway: { x: 460, y: 250 },
    backend_api: { x: 460, y: 430 },
    secrets: { x: 460, y: 590 },
    discovery: { x: 740, y: 90 },
    policy_engine: { x: 1010, y: 90 },
    security_analytics: { x: 740, y: 290 },
    database: { x: 740, y: 490 },
    object_storage: { x: 1010, y: 290 },
    analytics: { x: 1010, y: 490 },
    integration: { x: 1010, y: 650 },
    private_network: { x: 740, y: 650 },
    monitoring: { x: 460, y: 700 },
  },
  ai_application_stack: {
    users: { x: 22, y: 330 },
    waf: { x: 180, y: 120 },
    frontend: { x: 180, y: 280 },
    authentication: { x: 180, y: 440 },
    api_gateway: { x: 450, y: 280 },
    backend_api: { x: 450, y: 460 },
    ai_model_gateway: { x: 760, y: 220 },
    search: { x: 760, y: 420 },
    database: { x: 1030, y: 220 },
    object_storage: { x: 1030, y: 420 },
    analytics: { x: 1030, y: 620 },
    monitoring: { x: 760, y: 620 },
  },
};

const CLOUD_IMAGE_URLS = {
  azure: "https://cdn.simpleicons.org/microsoftazure/0078D4",
  aws: "https://cdn.simpleicons.org/amazonaws/FF9900",
  gcp: "https://cdn.simpleicons.org/googlecloud/4285F4",
} as const;

const AZURE_OFFICIAL_IMAGE_URLS: Record<string, string> = {
  waf:
    "/assets/azure-icons/Azure_Public_Service_Icons/Icons/networking/10362-icon-service-Web-Application-Firewall-Policies(WAF).svg",
  cdn:
    "/assets/azure-icons/Azure_Public_Service_Icons/Icons/networking/10073-icon-service-Front-Door-and-CDN-Profiles.svg",
  frontend:
    "/assets/azure-icons/Azure_Public_Service_Icons/Icons/web/01007-icon-service-Static-Apps.svg",
  authentication:
    "/assets/azure-icons/Azure_Public_Service_Icons/Icons/identity/03338-icon-service-External-Identities.svg",
  api_gateway:
    "/assets/azure-icons/Azure_Public_Service_Icons/Icons/web/10042-icon-service-API-Management-Services.svg",
  backend_api:
    "/assets/azure-icons/Azure_Public_Service_Icons/Icons/web/10035-icon-service-App-Services.svg",
  database:
    "/assets/azure-icons/Azure_Public_Service_Icons/Icons/databases/10130-icon-service-SQL-Database.svg",
  cache:
    "/assets/azure-icons/Azure_Public_Service_Icons/Icons/databases/10137-icon-service-Cache-Redis.svg",
  queue:
    "/assets/azure-icons/Azure_Public_Service_Icons/Icons/integration/10836-icon-service-Azure-Service-Bus.svg",
  object_storage:
    "/assets/azure-icons/Azure_Public_Service_Icons/Icons/storage/10086-icon-service-Storage-Accounts.svg",
  secrets:
    "/assets/azure-icons/Azure_Public_Service_Icons/Icons/security/10245-icon-service-Key-Vaults.svg",
  private_network:
    "/assets/azure-icons/Azure_Public_Service_Icons/Icons/networking/10061-icon-service-Virtual-Networks.svg",
  monitoring:
    "/assets/azure-icons/Azure_Public_Service_Icons/Icons/management%20%2B%20governance/00001-icon-service-Monitor.svg",
  analytics:
    "/assets/azure-icons/Azure_Public_Service_Icons/Icons/analytics/10126-icon-service-Power-BI-Embedded.svg",
  policy_engine:
    "/assets/azure-icons/Azure_Public_Service_Icons/Icons/management%20%2B%20governance/00012-icon-service-Policy.svg",
  security_analytics:
    "/assets/azure-icons/Azure_Public_Service_Icons/Icons/security/02148-icon-service-Defender-CSPM.svg",
  discovery:
    "/assets/azure-icons/Azure_Public_Service_Icons/Icons/management%20%2B%20governance/00003-icon-service-Resource-Graph-Explorer.svg",
  ai_model_gateway:
    "/assets/azure-icons/Azure_Public_Service_Icons/Icons/ai%20%2B%20machine%20learning/10787-icon-service-Azure-OpenAI.svg",
  search:
    "/assets/azure-icons/Azure_Public_Service_Icons/Icons/ai%20%2B%20machine%20learning/10044-icon-service-Cognitive-Search.svg",
  ml_platform:
    "/assets/azure-icons/Azure_Public_Service_Icons/Icons/ai%20%2B%20machine%20learning/00039-icon-service-Machine-Learning-Studio-Classic-Web-Services.svg",
  integration:
    "/assets/azure-icons/Azure_Public_Service_Icons/Icons/integration/10201-icon-service-Logic-Apps.svg",
} as const;

const SERVICE_IMAGE_URLS: Record<string, string> = {
  authentication: "https://cdn.simpleicons.org/auth0/EB5424",
  database: "https://cdn.simpleicons.org/postgresql/336791",
  cache: "https://cdn.simpleicons.org/redis/DC382D",
  queue: "https://cdn.simpleicons.org/apachekafka/FFFFFF",
  monitoring: "https://cdn.simpleicons.org/datadog/632CA6",
  object_storage: "https://cdn.simpleicons.org/cloudflare/FF7A00",
  private_network: "https://cdn.simpleicons.org/wireguard/88171A",
  waf: "https://cdn.simpleicons.org/cloudflare/FF7A00",
  secrets: "https://cdn.simpleicons.org/1password/3B66BC",
  api_gateway: "https://cdn.simpleicons.org/openapiinitiative/6BA539",
  backend_api: "https://cdn.simpleicons.org/docker/2496ED",
  frontend: "https://cdn.simpleicons.org/react/61DAFB",
  cdn: "https://cdn.simpleicons.org/cloudflare/FF7A00",
  analytics: "https://cdn.simpleicons.org/looker/4285F4",
  policy_engine: "https://cdn.simpleicons.org/openpolicyagent/7d9199",
  security_analytics: "https://cdn.simpleicons.org/sentry/362D59",
  discovery: "https://cdn.simpleicons.org/databricks/FF3621",
  ai_model_gateway: "https://cdn.simpleicons.org/openai/FFFFFF",
  search: "https://cdn.simpleicons.org/elasticsearch/005571",
  ml_platform: "https://cdn.simpleicons.org/mlflow/0194E2",
  integration: "https://cdn.simpleicons.org/n8n/EA4B71",
};

function serviceImage(cloud: ArchitectureResponse["cloud"], serviceId: string) {
  if (cloud === "azure" && AZURE_OFFICIAL_IMAGE_URLS[serviceId]) {
    return AZURE_OFFICIAL_IMAGE_URLS[serviceId];
  }

  return SERVICE_IMAGE_URLS[serviceId] ?? CLOUD_IMAGE_URLS[cloud];
}

function serviceSubtitle(service: ServiceMapping) {
  return service.cloud_service;
}

function categoryFill(category: string) {
  const fills: Record<string, string> = {
    security: "#2d1b1f",
    edge: "#1a2336",
    presentation: "#132b2b",
    identity: "#2a1c2e",
    api: "#18253c",
    compute: "#15233a",
    cache: "#2a1a22",
    messaging: "#241a31",
    data: "#182c21",
    storage: "#162d2d",
    analytics: "#122b35",
    governance: "#352810",
    control: "#1c2230",
    ai: "#23183b",
    integration: "#271b39",
    network: "#191d39",
    operations: "#1f2431",
    actor: "#102638",
  };

  return fills[category] ?? "#162033";
}

function columnTitle(column: string) {
  return column;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function xmlSafe(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function drawIoStyle(node: DiagramNode) {
  return [
    "rounded=1",
    "arcSize=18",
    "whiteSpace=wrap",
    "html=1",
    `fillColor=${categoryFill(node.category)}`,
    "strokeColor=#34435f",
    "fontColor=#ecf3ff",
    "fontSize=15",
    "spacingLeft=20",
    "spacingTop=18",
  ].join(";");
}

function activeLanes(architecture: ArchitectureResponse) {
  const configured =
    (architecture.archetype && ARCHETYPE_LANES[architecture.archetype]) ??
    DEFAULT_LANES;

  const presentCategories = new Set(
    architecture.services.map((service) => service.category),
  );

  return configured.filter((lane) =>
    lane.categories.some((category) => presentCategories.has(category)),
  );
}

function laneXPositions(lanes: LaneDefinition[]) {
  const positions = new Map<string, number>();
  const startX = 250;
  const availableWidth = VIEWBOX_WIDTH - startX - NODE_WIDTH - 40;
  const gap = lanes.length > 1 ? availableWidth / (lanes.length - 1) : 0;

  lanes.forEach((lane, index) => {
    positions.set(lane.id, Math.round(startX + index * gap));
  });

  return positions;
}

function laneForCategory(
  lanes: LaneDefinition[],
  category: string,
) {
  const matched = lanes.find((lane) => lane.categories.includes(category))?.id;
  if (matched) {
    return matched;
  }

  const fallback = lanes[lanes.length - 1];
  return fallback?.id ?? "governance";
}

function buildNodes(architecture: ArchitectureResponse) {
  const lanes = activeLanes(architecture);
  const lanePositions = laneXPositions(lanes);
  const layoutPreset =
    (architecture.archetype && ARCHETYPE_NODE_LAYOUTS[architecture.archetype]) ?? {};
  const nodes: DiagramNode[] = [
    {
      id: "users",
      title: "Users",
      subtitle: "clients • browsers",
      category: "actor",
      x: layoutPreset.users?.x ?? USER_COLUMN_X,
      y: layoutPreset.users?.y ?? 320,
      width: 150,
      height: 78,
      image: "https://cdn.simpleicons.org/googlemessages/FFFFFF",
      locked: true,
    },
  ];

  const grouped = new Map<string, ServiceMapping[]>();

  for (const service of architecture.services) {
    const lane = laneForCategory(lanes, service.category);
    const current = grouped.get(lane) ?? [];
    current.push(service);
    grouped.set(lane, current);
  }

  for (const lane of lanes) {
    const services = (grouped.get(lane.id) ?? []).sort((left, right) => {
      const leftIndex = lane.categories.indexOf(left.category);
      const rightIndex = lane.categories.indexOf(right.category);
      return leftIndex - rightIndex;
    });

    let currentY = 128;
    services.forEach((service, index) => {
      if (index > 0) {
        const previous = services[index - 1];
        currentY += previous.category === service.category ? NODE_HEIGHT + 20 : NODE_HEIGHT + 44;
      }

      const saved = architecture.canvas_layout?.[service.id];

      nodes.push({
        id: service.id,
        title: service.label,
        subtitle: serviceSubtitle(service),
        category: service.category,
        x: saved?.x ?? layoutPreset[service.id]?.x ?? (lanePositions.get(lane.id) ?? 240),
        y: saved?.y ?? layoutPreset[service.id]?.y ?? currentY,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        image: serviceImage(architecture.cloud, service.id),
      });
    });
  }

  return nodes;
}

function centerRight(node: DiagramNode) {
  return {
    x: node.x + node.width,
    y: node.y + node.height / 2,
  };
}

function centerLeft(node: DiagramNode) {
  return {
    x: node.x,
    y: node.y + node.height / 2,
  };
}

function pathBetween(source: DiagramNode, target: DiagramNode) {
  const start = centerRight(source);
  const end = centerLeft(target);
  const delta = Math.max(36, (end.x - start.x) / 2);
  return `M ${start.x} ${start.y} C ${start.x + delta} ${start.y}, ${end.x - delta} ${end.y}, ${end.x} ${end.y}`;
}

function connectionLine(source: DiagramNode, target: DiagramNode) {
  const start = centerRight(source);
  const end = centerLeft(target);
  return {
    x1: Math.round(start.x),
    y1: Math.round(start.y),
    x2: Math.round(end.x),
    y2: Math.round(end.y),
  };
}

function connectionsForDisplay(architecture: ArchitectureResponse) {
  if (architecture.archetype !== "ai_security_and_compliance") {
    return architecture.connections;
  }

  const preferredOrder = [
    "users->waf",
    "waf->frontend",
    "frontend->api_gateway",
    "api_gateway->backend_api",
    "backend_api->discovery",
    "discovery->policy_engine",
    "policy_engine->security_analytics",
    "backend_api->database",
    "backend_api->object_storage",
    "security_analytics->analytics",
    "backend_api->integration",
    "backend_api->secrets",
    "private_network->backend_api",
    "private_network->database",
    "private_network->object_storage",
    "monitoring->backend_api",
    "monitoring->security_analytics",
    "monitoring->analytics",
  ];

  const selected = preferredOrder
    .map((key) =>
      architecture.connections.find(
        (connection) => `${connection.source}->${connection.target}` === key,
      ),
    )
    .filter((connection): connection is Connection => Boolean(connection));

  return selected.length > 0 ? selected : architecture.connections;
}

function shouldShowConnectionLabel(
  connection: Connection,
  source: DiagramNode,
  target: DiagramNode,
) {
  if (connection.dashed) {
    return false;
  }

  const horizontalGap = Math.abs(target.x - source.x);
  const verticalGap = Math.abs(target.y - source.y);
  return horizontalGap > 120 || verticalGap > 90;
}

function buildCanvasLayout(nodes: DiagramNode[]) {
  const layout: CanvasLayout = {};

  nodes.forEach((node) => {
    if (!node.locked) {
      layout[node.id] = { x: Math.round(node.x), y: Math.round(node.y) };
    }
  });

  return layout;
}

async function dataUrlForImage(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return url;
    }

    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return url;
  }
}

async function buildExportSvgMarkup(svgElement: SVGSVGElement) {
  const clone = svgElement.cloneNode(true) as SVGSVGElement;
  const images = Array.from(clone.querySelectorAll("image"));

  await Promise.all(
    images.map(async (image) => {
      const href =
        image.getAttribute("href") ?? image.getAttributeNS("http://www.w3.org/1999/xlink", "href");

      if (!href || href.startsWith("data:")) {
        return;
      }

      const embedded = await dataUrlForImage(href);
      image.setAttribute("href", embedded);
    }),
  );

  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

  const markup = new XMLSerializer().serializeToString(clone);
  return `<?xml version="1.0" encoding="UTF-8"?>\n${markup}`;
}

function buildDrawIoXml(
  architecture: ArchitectureResponse,
  nodes: DiagramNode[],
  connections: Connection[],
) {
  const nodeCells = nodes
    .map((node, index) => {
      const id = `node-${index + 2}`;
      return `
        <mxCell id="${id}" value="${xmlSafe(`${node.title}&#xa;${node.subtitle}`)}" style="${xmlSafe(drawIoStyle(node))}" vertex="1" parent="1">
          <mxGeometry x="${Math.round(node.x)}" y="${Math.round(node.y)}" width="${Math.round(node.width)}" height="${Math.round(node.height)}" as="geometry" />
        </mxCell>`;
    })
    .join("");

  const ids = new Map(nodes.map((node, index) => [node.id, `node-${index + 2}`]));
  const edgeCells = connections
    .map((connection, index) => {
      const source = ids.get(connection.source);
      const target = ids.get(connection.target);

      if (!source || !target) {
        return "";
      }

      return `
        <mxCell id="edge-${index + 100}" value="${xmlSafe(connection.label ?? "")}" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=#7dd3fc;dashed=${connection.dashed ? 1 : 0};fontColor=#cbd5e1;" edge="1" parent="1" source="${source}" target="${target}">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="${new Date().toISOString()}" agent="AI Architect" version="24.7.17">
  <diagram id="${xmlSafe(architecture.request_id)}" name="${xmlSafe(architecture.title)}">
    <mxGraphModel dx="${VIEWBOX_WIDTH}" dy="${VIEWBOX_HEIGHT}" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1920" pageHeight="1080" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        ${nodeCells}
        ${edgeCells}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;
}

function downloadTextFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function slugifyTitle(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

export function ArchitectureBoard({
  architecture,
  onLayoutChange,
  readOnly = false,
  showLegend = true,
  showToolbar = true,
  showConnectionLabels = true,
}: {
  architecture: ArchitectureResponse;
  onLayoutChange?: (layout: CanvasLayout) => void;
  readOnly?: boolean;
  showLegend?: boolean;
  showToolbar?: boolean;
  showConnectionLabels?: boolean;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const [nodes, setNodes] = useState(() => buildNodes(architecture));
  const [exporting, setExporting] = useState<string | null>(null);
  const lanes = activeLanes(architecture);
  const lanePositions = laneXPositions(lanes);
  const visibleConnections = connectionsForDisplay(architecture);
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));

  useEffect(() => {
    setNodes(buildNodes(architecture));
  }, [architecture]);

  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      const dragState = dragStateRef.current;
      const svgElement = svgRef.current;

      if (!dragState || !svgElement) {
        return;
      }

      const rect = svgElement.getBoundingClientRect();
      const svgX = ((event.clientX - rect.left) / rect.width) * VIEWBOX_WIDTH;
      const svgY = ((event.clientY - rect.top) / rect.height) * VIEWBOX_HEIGHT;

      setNodes((current) =>
        current.map((node) =>
          node.id !== dragState.nodeId
            ? node
            : {
                ...node,
                x: clamp(svgX - dragState.offsetX, 20, VIEWBOX_WIDTH - node.width - 20),
                y: clamp(svgY - dragState.offsetY, 32, VIEWBOX_HEIGHT - node.height - 32),
              },
        ),
      );
    }

    function handlePointerUp() {
      if (!dragStateRef.current) {
        return;
      }

      dragStateRef.current = null;
      document.body.style.userSelect = "";
      onLayoutChange?.(buildCanvasLayout(nodes));
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [nodes, onLayoutChange]);

  function handlePointerDown(
    event: ReactPointerEvent<SVGGElement>,
    node: DiagramNode,
  ) {
    if (node.locked || !svgRef.current) {
      return;
    }

    if (readOnly) {
      return;
    }

    const rect = svgRef.current.getBoundingClientRect();
    const svgX = ((event.clientX - rect.left) / rect.width) * VIEWBOX_WIDTH;
    const svgY = ((event.clientY - rect.top) / rect.height) * VIEWBOX_HEIGHT;

    dragStateRef.current = {
      nodeId: node.id,
      offsetX: svgX - node.x,
      offsetY: svgY - node.y,
    };

    document.body.style.userSelect = "none";
  }

  function resetLayout() {
    const resetNodes = buildNodes({ ...architecture, canvas_layout: undefined });
    setNodes(resetNodes);
    onLayoutChange?.(buildCanvasLayout(resetNodes));
  }

  async function exportSvg(filename: string) {
    if (!svgRef.current) {
      return;
    }

    setExporting(filename);
    const markup = await buildExportSvgMarkup(svgRef.current);
    downloadTextFile(filename, markup, "image/svg+xml;charset=utf-8");
    setExporting(null);
  }

  async function exportPng() {
    if (!svgRef.current) {
      return;
    }

    setExporting("png");

    try {
      const markup = await buildExportSvgMarkup(svgRef.current);
      const blob = new Blob([markup], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const image = new Image();

      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("PNG export failed."));
        image.src = url;
      });

      const canvas = document.createElement("canvas");
      canvas.width = VIEWBOX_WIDTH * 2;
      canvas.height = VIEWBOX_HEIGHT * 2;

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Canvas export is unavailable in this browser.");
      }

      context.fillStyle = "#09111f";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((pngBlob) => {
        if (!pngBlob) {
          throw new Error("PNG export returned an empty file.");
        }

        const pngUrl = URL.createObjectURL(pngBlob);
        const link = document.createElement("a");
        link.href = pngUrl;
        link.download = `${slugifyTitle(architecture.title)}-architecture.png`;
        link.click();
        URL.revokeObjectURL(pngUrl);
      }, "image/png");

      URL.revokeObjectURL(url);
    } finally {
      setExporting(null);
    }
  }

  async function exportDrawIo() {
    setExporting("drawio");
    const xml = buildDrawIoXml(architecture, nodes, architecture.connections);
    downloadTextFile(
      `${slugifyTitle(architecture.title)}-architecture.drawio`,
      xml,
      "application/xml;charset=utf-8",
    );
    setExporting(null);
  }

  return (
    <section className="card board-shell">
      <div className="board-toolbar">
        {showToolbar ? (
          <>
            <div>
              <p className="eyebrow">Live Architecture Canvas</p>
              <h2>{architecture.cloud.toUpperCase()} visual diagram</h2>
              <p className="section-copy">
                Drag services to tune the layout, then export the current canvas as
                enterprise handoff assets for engineering and architecture reviews.
              </p>
              {architecture.domain || architecture.archetype ? (
                <div className="pill-row">
                  {architecture.domain ? (
                    <span className="priority-pill">
                      {architecture.domain.replace(/_/g, " ")}
                    </span>
                  ) : null}
                  {architecture.archetype ? (
                    <span className="priority-pill">
                      {architecture.archetype.replace(/_/g, " ")}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="board-actions">
              <button className="secondary-button" onClick={resetLayout} type="button">
                Reset layout
              </button>
              <button
                className="secondary-button"
                disabled={Boolean(exporting)}
                onClick={() => exportSvg(`${architecture.request_id}-architecture.svg`)}
                type="button"
              >
                {exporting === `${architecture.request_id}-architecture.svg`
                  ? "Exporting..."
                  : "Download SVG"}
              </button>
              <button
                className="secondary-button"
                disabled={Boolean(exporting)}
                onClick={exportPng}
                type="button"
              >
                {exporting === "png" ? "Exporting..." : "Download PNG"}
              </button>
              <button
                className="secondary-button"
                disabled={Boolean(exporting)}
                onClick={exportDrawIo}
                type="button"
              >
                {exporting === "drawio" ? "Exporting..." : "Draw.io XML"}
              </button>
              <button
                className="primary-button"
                disabled={Boolean(exporting)}
                onClick={() =>
                  exportSvg(`${architecture.request_id}-visio-import.svg`)
                }
                type="button"
              >
                {exporting === `${architecture.request_id}-visio-import.svg`
                  ? "Exporting..."
                  : "Visio Import SVG"}
              </button>
            </div>
          </>
        ) : null}
      </div>

      {showToolbar ? (
        <div className="canvas-hint">
          <span>Drag any service card to rearrange the architecture.</span>
          <span>Layout autosaves on release for this project.</span>
        </div>
      ) : null}

      <div className="canvas-shell">
        <svg
          ref={svgRef}
          className="architecture-canvas"
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="boardGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(45, 212, 191, 0.18)" />
              <stop offset="100%" stopColor="rgba(14, 116, 144, 0)" />
            </linearGradient>
          </defs>

          <rect
            fill="#0d1730"
            height={VIEWBOX_HEIGHT}
            rx="36"
            width={VIEWBOX_WIDTH}
            x="0"
            y="0"
          />
          <rect
            fill="url(#boardGlow)"
            height={VIEWBOX_HEIGHT}
            rx="36"
            width={VIEWBOX_WIDTH}
            x="0"
            y="0"
          />

          {lanes.map((lane) => (
              <g key={lane.id}>
                <text
                  fill="#7dd3fc"
                  fontFamily="'IBM Plex Mono', monospace"
                  fontSize="14"
                  letterSpacing="1.4"
                  x={lanePositions.get(lane.id) ?? 240}
                  y="54"
                >
                  {columnTitle(lane.title)}
                </text>
                <line
                  stroke="rgba(125, 211, 252, 0.12)"
                  strokeDasharray="6 10"
                  strokeWidth="1"
                  x1={(lanePositions.get(lane.id) ?? 240) - 26}
                  x2={(lanePositions.get(lane.id) ?? 240) - 26}
                  y1="72"
                  y2={VIEWBOX_HEIGHT - 40}
                />
              </g>
            ))}

          {visibleConnections.map((connection) => {
            const source = nodeMap.get(connection.source);
            const target = nodeMap.get(connection.target);

            if (!source || !target) {
              return null;
            }

            const line = connectionLine(source, target);
            const labelX = (line.x1 + line.x2) / 2;
            const labelY = (line.y1 + line.y2) / 2 - 10;

            return (
              <g key={`${connection.source}-${connection.target}-${connection.label ?? "line"}`}>
                <path
                  d={pathBetween(source, target)}
                  fill="none"
                  stroke={connection.dashed ? "#7dd3fc" : "#94a3b8"}
                  strokeDasharray={connection.dashed ? "10 10" : undefined}
                  strokeLinecap="round"
                  strokeWidth={connection.dashed ? 4 : 3}
                />
                {showConnectionLabels &&
                connection.label &&
                shouldShowConnectionLabel(connection, source, target) ? (
                  <text
                    fill="#cbd5e1"
                    fontFamily="'IBM Plex Mono', monospace"
                    fontSize="13"
                    x={labelX}
                    y={labelY}
                  >
                    {connection.label}
                  </text>
                ) : null}
              </g>
            );
          })}

          {nodes.map((node) => (
            <g
              key={node.id}
              className={node.locked ? "canvas-node is-locked" : "canvas-node"}
              onPointerDown={(event) => handlePointerDown(event, node)}
              style={{ cursor: readOnly || node.locked ? "default" : "grab" }}
            >
              <rect
                fill={categoryFill(node.category)}
                height={node.height}
                rx="26"
                stroke={node.locked ? "#3dd5cf" : "#40506d"}
                strokeWidth={node.locked ? 3 : 2}
                width={node.width}
                x={node.x}
                y={node.y}
              />
              <rect
                fill="rgba(255,255,255,0.04)"
                height="62"
                rx="18"
                stroke="rgba(255,255,255,0.06)"
                width="62"
                x={node.x + 16}
                y={node.y + 17}
              />
              <image
                height="36"
                href={node.image}
                width="36"
                x={node.x + 29}
                y={node.y + 30}
              />
              <text
                fill="#f8fafc"
                fontFamily="Manrope, sans-serif"
                fontSize="16"
                fontWeight="700"
                x={node.x + 92}
                y={node.y + 42}
              >
                {node.title}
              </text>
              <text
                fill="#9fb0cb"
                fontFamily="'IBM Plex Mono', monospace"
                fontSize="13"
                x={node.x + 92}
                y={node.y + 72}
              >
                {node.subtitle}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {showLegend ? (
        <div className="board-legend">
          {nodes
            .filter((node) => node.id !== "users")
            .map((node) => (
              <div className="legend-chip" key={node.id}>
                <img
                  alt={node.title}
                  className="legend-chip-image"
                  src={node.image}
                />
                <span>{node.title}</span>
              </div>
            ))}
        </div>
      ) : null}
    </section>
  );
}
