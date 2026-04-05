# AI Cloud Architecture Generator

A full-stack MVP that turns a plain-English product idea into a cloud architecture proposal, explanation, editable visual canvas, and optional infrastructure code starter.

## Documentation

- Product and setup overview: [README.md](/Users/kasisureshdevarajugattu/Coding/AI-Arch/README.md)
- End-to-end technical walkthrough: [docs/TECHNICAL_WALKTHROUGH.md](/Users/kasisureshdevarajugattu/Coding/AI-Arch/docs/TECHNICAL_WALKTHROUGH.md)
- Code explanation: [docs/CODE_EXPLANATION.md](/Users/kasisureshdevarajugattu/Coding/AI-Arch/docs/CODE_EXPLANATION.md)
- Accuracy and enterprise roadmap: [docs/ACCURACY_AND_ENTERPRISE_ROADMAP.md](/Users/kasisureshdevarajugattu/Coding/AI-Arch/docs/ACCURACY_AND_ENTERPRISE_ROADMAP.md)

## What It Includes

- Natural-language architecture intake
- Enterprise workload profile intake for availability, compliance, tenancy, network exposure, and environment strategy
- Deterministic intent parsing with optional OpenAI-backed or OpenAI-compatible LLM parsing
- Domain-aware classification into solution types such as web SaaS, AI platforms, AI governance, data platforms, and cybersecurity products
- Multi-cloud mapping for Azure, AWS, and GCP
- Native SVG architecture canvas with cloud imagery
- Architecture explanation and next-step guidance
- Security controls, resilience notes, operational guidance, and risk flags
- Deployable Terraform for the supported Azure resource set
- React frontend with dedicated `Arch`, `Code`, and `Ship` workspaces
- Backend-backed project persistence with version history and restore
- FastAPI backend for generation, chat, project CRUD, history, restore, and Azure deploy/prepare flows

## Stack

- Frontend: React, TypeScript, Vite
- Backend: FastAPI, Pydantic
- Architecture engine: domain classifier, intent parser, archetype-aware cloud mapper, native SVG canvas plus Mermaid export

## Project Layout

```text
backend/
  app/
    api/
    core/
    services/
  data/
frontend/
  src/
docs/
  TECHNICAL_WALKTHROUGH.md
```

## End-to-End Flow

```mermaid
flowchart LR
    A[User Prompt] --> B[Frontend Studio or Copilot]
    B --> C[FastAPI API]
    C --> D[Intent Parser / Chat Router]
    D --> E[Cloud Mapping Engine]
    E --> F[Diagram + Explanation + IaC Builders]
    F --> G[Architecture Response]
    G --> H[Frontend Pages + Chat + Backend Project Store]
```

## Run The Backend

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn app.main:app --reload --app-dir backend
```

The API starts on `http://localhost:8000`.

## Run The Frontend

```bash
cd frontend
npm install
npm run dev
```

The web app starts on `http://localhost:5173`.

Project routes:

- `/` marketing landing page
- `/app/studio` architecture creation workspace
- `/app/projects` saved library
- `/app/projects/:projectId/arch` architecture workspace
- `/app/projects/:projectId/code` infrastructure code page
- `/app/projects/:projectId/ship` Azure deploy workspace

## Environment Variables

Copy the example files if you want to customize local settings:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### Backend

- `AI_ARCHITECT_INTENT_BACKEND=heuristic` uses the built-in parser
- `AI_ARCHITECT_INTENT_BACKEND=openai` enables OpenAI parsing when `OPENAI_API_KEY` is set
- `AI_ARCHITECT_INTENT_BACKEND=llm_service` enables your OpenAI-compatible hosted LLM
- `AI_ARCHITECT_OPENAI_MODEL=gpt-4.1-mini`
- `AI_ARCHITECT_LLM_BASE_URL=https://kasdevtech-llm.onrender.com/v1`
- `AI_ARCHITECT_LLM_API_KEY=local-service`
- `AI_ARCHITECT_LLM_MODEL=qwen2.5-0.5b`
- `AI_ARCHITECT_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173`
- `AI_ARCHITECT_CORS_ORIGIN_REGEX=https?://.*`

### Frontend

- `VITE_API_URL=http://localhost:8000/api/v1`

## API Examples

```bash
curl -X POST http://localhost:8000/api/v1/architectures/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Build a scalable web app with a frontend, backend API, relational database, authentication, and CDN.",
    "cloud": "azure",
    "include_iac": true
  }'
```

```bash
curl http://localhost:8000/api/v1/projects
```

```bash
curl -X POST http://localhost:8000/api/v1/architectures/deploy/azure/prepare \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "demo-project",
    "project_title": "Customer Platform",
    "cloud": "azure",
    "profile": {
      "auth_mode": "service_principal",
      "tenant_id": "tenant-id",
      "subscription_id": "subscription-id",
      "client_id": "client-id",
      "client_secret": "client-secret",
      "resource_group": "demo-rg",
      "location": "eastus",
      "deployment_name": "demo-deploy"
    },
    "preferences": {
      "workload_name": "Customer Platform",
      "environments": ["dev", "staging", "prod"],
      "availability_tier": "high_availability",
      "data_sensitivity": "confidential",
      "network_exposure": "public",
      "user_scale": "business",
      "compliance_frameworks": [],
      "multi_region": false,
      "disaster_recovery": true,
      "tenancy": "pooled_multi_tenant"
    },
    "services": []
  }'
```

## Notes

- The engine stays deterministic after intent parsing so service mapping and deploy artifacts stay stable.
- Projects now persist through backend APIs, with version history and restore support.
- `Ship` includes a backend prepare step so users can inspect the deployable inventory before apply.
- The generated Terraform is deployable for the currently supported Azure resource subset and still marks unsupported services clearly.
- The backend falls back to heuristic parsing automatically if the selected LLM backend is unavailable or returns invalid JSON.

## Deployment

### Lowest-cost Azure path

- Frontend: Azure Static Web Apps
- Backend: Azure Container Apps on consumption or a small Azure App Service plan
- Routing: `frontend/public/staticwebapp.config.json` already includes SPA fallback for nested routes
- Container image: `backend/Dockerfile` can be used for Container Apps or Web App for Containers

### Render path

- `render.yaml` is included for a simple two-service setup
- Backend: Python web service running FastAPI
- Frontend: static site serving the Vite build
- Update the Render hostnames in `render.yaml` to your final service names before deploying
