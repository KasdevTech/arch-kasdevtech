# Code Explanation

This document explains the codebase file by file, focusing on the purpose of each module and how the main logic works.

## Backend

Backend root: [backend/app](/Users/kasisureshdevarajugattu/Coding/AI-Arch/backend/app)

### [main.py](/Users/kasisureshdevarajugattu/Coding/AI-Arch/backend/app/main.py)

Purpose:

- boots the FastAPI app
- applies CORS configuration
- mounts the API router
- exposes health endpoints

Why it matters:

- this is the backend entry point
- deployment issues like CORS and health checks are controlled here

### [core/config.py](/Users/kasisureshdevarajugattu/Coding/AI-Arch/backend/app/core/config.py)

Purpose:

- reads environment variables into a typed settings object

Important settings:

- `AI_ARCHITECT_INTENT_BACKEND`
- `OPENAI_API_KEY`
- `AI_ARCHITECT_LLM_BASE_URL`
- `AI_ARCHITECT_LLM_MODEL`
- CORS origin settings

Technique:

- lightweight dataclass config instead of a heavier settings framework

### [api/routes.py](/Users/kasisureshdevarajugattu/Coding/AI-Arch/backend/app/api/routes.py)

Purpose:

- defines public API endpoints

Endpoints:

- `/architectures/generate`
- `/architectures/chat`

Pattern:

- thin controller layer
- push business logic into services

### [models.py](/Users/kasisureshdevarajugattu/Coding/AI-Arch/backend/app/models.py)

Purpose:

- defines the shared backend data model

Main groups:

- cloud and architecture enums
- request payloads
- parsed intent objects
- final architecture response objects
- chat request/response models

Why it matters:

- this file is the contract for almost the whole system
- both generation and chat rely on these types

### [services/architecture_service.py](/Users/kasisureshdevarajugattu/Coding/AI-Arch/backend/app/services/architecture_service.py)

Purpose:

- orchestrates the full architecture generation pipeline

Flow:

1. parse prompt into intent
2. map intent to cloud services
3. build diagram text
4. build explanation text
5. build IaC starter
6. return normalized response

Design choice:

- one orchestration service keeps generation logic centralized and predictable

### [services/intent_parser.py](/Users/kasisureshdevarajugattu/Coding/AI-Arch/backend/app/services/intent_parser.py)

Purpose:

- converts prompt text into an internal `ArchitectureIntent`

Key responsibilities:

- detect domain
- choose archetype
- infer required components
- normalize preferences
- derive priorities and patterns

Parsing modes:

- heuristic
- OpenAI
- OpenAI-compatible hosted LLM

Important techniques:

- domain override rules
- archetype selection
- component keyword extraction
- fast-path heuristic parsing for common prompts
- LLM fallback for complex cases
- lightweight pattern ranking signals for domain/archetype confidence
- lightweight classifier signals from curated examples

### [services/architecture_classifier.py](/Users/kasisureshdevarajugattu/Coding/AI-Arch/backend/app/services/architecture_classifier.py)

Purpose:

- predicts domain/archetype from curated pattern examples

How it works:

- tokenizes prompts
- builds a tiny local text model from pattern examples
- scores each pattern family
- returns the highest-confidence prediction

Why it matters:

- adds a real model-style classification signal
- reduces dependence on keyword rules alone

This is one of the most important files in the entire product.

### [services/mapping_engine.py](/Users/kasisureshdevarajugattu/Coding/AI-Arch/backend/app/services/mapping_engine.py)

Purpose:

- maps generic architecture components to actual Azure, AWS, or GCP services

Main structures:

- `BASE_SERVICE_CATALOG`
- `ARCHETYPE_OVERRIDES`

What it does:

- picks cloud-native services
- adds rationale text
- builds inter-service connections

Why this is critical:

- this is the main anti-hallucination layer
- the model can suggest intent, but final service mapping is deterministic

### [services/pattern_library.py](/Users/kasisureshdevarajugattu/Coding/AI-Arch/backend/app/services/pattern_library.py)

Purpose:

- stores curated solution pattern packs
- ranks prompts against those packs

What it adds:

- top matched pattern list
- lightweight similarity score
- more stable domain/archetype routing

### [services/architecture_validator.py](/Users/kasisureshdevarajugattu/Coding/AI-Arch/backend/app/services/architecture_validator.py)

Purpose:

- validates generated architectures against expected enterprise patterns

What it adds:

- confidence score
- matched pattern title
- findings and recommendations

### [services/diagram_service.py](/Users/kasisureshdevarajugattu/Coding/AI-Arch/backend/app/services/diagram_service.py)

Purpose:

- renders Mermaid diagram text from mapped services and connections

Why it exists:

- machine-readable architecture output
- export/debug value
- fallback diagram format

### [services/explanation_service.py](/Users/kasisureshdevarajugattu/Coding/AI-Arch/backend/app/services/explanation_service.py)

Purpose:

- generates structured architecture explanation content

Output sections:

- executive summary
- topology
- security and governance
- operations and resilience

Also produces:

- topology highlights
- security controls
- resilience notes
- operational controls
- risk flags
- next steps

Technique:

- deterministic text assembly from architecture intent + mapped services

### [services/iac_service.py](/Users/kasisureshdevarajugattu/Coding/AI-Arch/backend/app/services/iac_service.py)

Purpose:

- generates Terraform starter scaffolding

What it includes:

- provider block
- locals
- regions and tags
- platform foundation module
- per-service module stubs

Why it is useful:

- bridges design to implementation
- gives teams a starting point for real IaC

### [services/chat_service.py](/Users/kasisureshdevarajugattu/Coding/AI-Arch/backend/app/services/chat_service.py)

Purpose:

- powers the architecture copilot conversation

Current behavior:

- LLM-first routing for `reply`, `clarify`, or `generate`
- preflight handling for:
  - greetings
  - obvious garbage input
  - clear architecture prompts
- architecture generation is delegated to `ArchitectureService`

Why this is important:

- chat feels conversational
- architecture generation still remains grounded and deterministic

### [services/prompt_templates.py](/Users/kasisureshdevarajugattu/Coding/AI-Arch/backend/app/services/prompt_templates.py)

Purpose:

- stores the system prompts used by the LLM features

Prompt groups:

- intent parser prompt
- chat assistant prompt
- chat router prompt

Technique:

- prompt logic is centralized instead of being embedded inline across services

## Frontend

Frontend root: [frontend/src](/Users/kasisureshdevarajugattu/Coding/AI-Arch/frontend/src)

### [main.tsx](/Users/kasisureshdevarajugattu/Coding/AI-Arch/frontend/src/main.tsx)

Purpose:

- frontend entry point
- mounts React app
- wraps providers

### [App.tsx](/Users/kasisureshdevarajugattu/Coding/AI-Arch/frontend/src/App.tsx)

Purpose:

- defines top-level routing
- mounts the global `ArchitectChatWidget`

Routes handled:

- landing
- studio
- project library
- detail sub-pages

### [api.ts](/Users/kasisureshdevarajugattu/Coding/AI-Arch/frontend/src/api.ts)

Purpose:

- frontend API client wrapper

Functions:

- `generateArchitecture`
- `chatWithArchitect`

Why it exists:

- keeps fetch logic out of page components
- centralizes API base URL usage

### [types.ts](/Users/kasisureshdevarajugattu/Coding/AI-Arch/frontend/src/types.ts)

Purpose:

- frontend type layer for architecture requests, responses, canvas layout, and chat

Why it matters:

- keeps React components type-safe
- mirrors the backend contract clearly

### [context/ArchitectureStore.tsx](/Users/kasisureshdevarajugattu/Coding/AI-Arch/frontend/src/context/ArchitectureStore.tsx)

Purpose:

- stores generated projects in local browser storage

Capabilities:

- save project
- fetch project
- remove project
- update canvas layout

Why it exists:

- simple persistence for MVP behavior
- supports SaaS-like project navigation without a backend database yet

### [components/ArchitectureComposer.tsx](/Users/kasisureshdevarajugattu/Coding/AI-Arch/frontend/src/components/ArchitectureComposer.tsx)

Purpose:

- the main architecture intake UI

What it handles:

- prompt entry
- cloud selector
- enterprise workload preferences
- quick prompt chips
- submit/generate flow

Technique:

- controlled form components
- reusable preference updaters

### [components/ArchitectureBoard.tsx](/Users/kasisureshdevarajugattu/Coding/AI-Arch/frontend/src/components/ArchitectureBoard.tsx)

Purpose:

- native architecture diagram renderer

Core responsibilities:

- lane-based layout
- archetype-specific staged layouts
- cloud service icon mapping
- connection rendering
- drag-and-drop node movement
- read-only and editable canvas modes

This is the main visual engine in the frontend.

### [components/ArchitectureReport.tsx](/Users/kasisureshdevarajugattu/Coding/AI-Arch/frontend/src/components/ArchitectureReport.tsx)

Purpose:

- presents architecture explanation and report content in a readable summary view

### [components/TerraformModulesPage.tsx](/Users/kasisureshdevarajugattu/Coding/AI-Arch/frontend/src/components/TerraformModulesPage.tsx)

Purpose:

- displays infrastructure code output in a dedicated page

### [components/ProjectCard.tsx](/Users/kasisureshdevarajugattu/Coding/AI-Arch/frontend/src/components/ProjectCard.tsx)

Purpose:

- reusable project tile for library/listing views

### [components/AppLayout.tsx](/Users/kasisureshdevarajugattu/Coding/AI-Arch/frontend/src/components/AppLayout.tsx)

Purpose:

- app shell, sidebar, and shared workspace framing

Why it matters:

- this is what makes the app feel like a SaaS workspace instead of a demo page

### [components/ArchitectChatWidget.tsx](/Users/kasisureshdevarajugattu/Coding/AI-Arch/frontend/src/components/ArchitectChatWidget.tsx)

Purpose:

- floating architecture copilot

What it does:

- opens from any page
- keeps chat history locally
- calls backend chat endpoint
- renders architecture inline
- saves generated projects into the library

This is the main conversational UX entry point.

### [pages/LandingPage.tsx](/Users/kasisureshdevarajugattu/Coding/AI-Arch/frontend/src/pages/LandingPage.tsx)

Purpose:

- marketing and product entry page

### [pages/StudioPage.tsx](/Users/kasisureshdevarajugattu/Coding/AI-Arch/frontend/src/pages/StudioPage.tsx)

Purpose:

- main architecture creation workspace

What it combines:

- intake form
- blueprint starters
- recent projects
- enterprise guidance panels

### [pages/ProjectsPage.tsx](/Users/kasisureshdevarajugattu/Coding/AI-Arch/frontend/src/pages/ProjectsPage.tsx)

Purpose:

- saved project library

### [pages/ArchitectureDetailPage.tsx](/Users/kasisureshdevarajugattu/Coding/AI-Arch/frontend/src/pages/ArchitectureDetailPage.tsx)

Purpose:

- wrapper page for a single project
- manages overview/architecture/code sub-navigation

### [pages/ProjectOverviewPage.tsx](/Users/kasisureshdevarajugattu/Coding/AI-Arch/frontend/src/pages/ProjectOverviewPage.tsx)

Purpose:

- high-level project summary, controls, and navigation

### [pages/ProjectArchitecturePage.tsx](/Users/kasisureshdevarajugattu/Coding/AI-Arch/frontend/src/pages/ProjectArchitecturePage.tsx)

Purpose:

- architecture canvas page

### [pages/ProjectTerraformPage.tsx](/Users/kasisureshdevarajugattu/Coding/AI-Arch/frontend/src/pages/ProjectTerraformPage.tsx)

Purpose:

- code/IaC page

### [pages/ChatPage.tsx](/Users/kasisureshdevarajugattu/Coding/AI-Arch/frontend/src/pages/ChatPage.tsx)

Purpose:

- lightweight route placeholder that points users toward the floating copilot experience

### [data/catalog.ts](/Users/kasisureshdevarajugattu/Coding/AI-Arch/frontend/src/data/catalog.ts)

Purpose:

- keeps predefined prompts, cloud option copy, blueprint templates, and starter defaults

### [index.css](/Users/kasisureshdevarajugattu/Coding/AI-Arch/frontend/src/index.css)

Purpose:

- shared styling system
- product shell styles
- card/panel/button primitives
- diagram and copilot widget styling

## Code Reading Order

If you want the best code tour, read in this order:

1. [README.md](/Users/kasisureshdevarajugattu/Coding/AI-Arch/README.md)
2. [docs/TECHNICAL_WALKTHROUGH.md](/Users/kasisureshdevarajugattu/Coding/AI-Arch/docs/TECHNICAL_WALKTHROUGH.md)
3. [models.py](/Users/kasisureshdevarajugattu/Coding/AI-Arch/backend/app/models.py)
4. [intent_parser.py](/Users/kasisureshdevarajugattu/Coding/AI-Arch/backend/app/services/intent_parser.py)
5. [mapping_engine.py](/Users/kasisureshdevarajugattu/Coding/AI-Arch/backend/app/services/mapping_engine.py)
6. [architecture_service.py](/Users/kasisureshdevarajugattu/Coding/AI-Arch/backend/app/services/architecture_service.py)
7. [chat_service.py](/Users/kasisureshdevarajugattu/Coding/AI-Arch/backend/app/services/chat_service.py)
8. [App.tsx](/Users/kasisureshdevarajugattu/Coding/AI-Arch/frontend/src/App.tsx)
9. [ArchitectureComposer.tsx](/Users/kasisureshdevarajugattu/Coding/AI-Arch/frontend/src/components/ArchitectureComposer.tsx)
10. [ArchitectureBoard.tsx](/Users/kasisureshdevarajugattu/Coding/AI-Arch/frontend/src/components/ArchitectureBoard.tsx)
11. [ArchitectChatWidget.tsx](/Users/kasisureshdevarajugattu/Coding/AI-Arch/frontend/src/components/ArchitectChatWidget.tsx)
