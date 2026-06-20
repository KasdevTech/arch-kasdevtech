# Interview Questions For This Project

This document contains interview-style questions and strong answer directions for discussing the AI Architect project.

## 1. Product Overview

### Q1. What does this project do?

Answer direction:

- It turns natural-language system requirements into cloud architectures.
- It classifies the prompt into a solution domain and archetype.
- It maps generic components to Azure, AWS, or GCP services.
- It generates a visual architecture canvas, explanation, Terraform, and a deployment plan.
- It also supports a conversational copilot mode and backend project persistence with version history.

### Q2. What problem are you solving?

Answer direction:

- Teams often know what they want to build, but not how to turn that into a reviewable architecture quickly.
- This product reduces the “blank page” problem for architects, developers, DevOps engineers, and founders.

## 2. Architecture And Design

### Q3. Why didn’t you let the LLM generate everything?

Answer direction:

- LLMs are useful for understanding the prompt, but not trustworthy enough to freely invent final architectures.
- The project uses a hybrid approach:
  - LLM or heuristics for understanding
  - deterministic mapping for cloud services
  - validation after generation
- That reduces hallucinations and keeps output more stable.

### Q4. How do you control hallucinations?

Answer direction:

- typed schemas and enums
- deterministic service catalogs
- archetype routing
- architecture validator and confidence scoring
- fallback from LLM to heuristics when parsing fails

### Q5. What is the most important backend service in this repo?

Answer direction:

- `intent_parser.py` and `mapping_engine.py`
- parser decides what kind of system the user asked for
- mapper decides which actual cloud services represent that system

## 3. Frontend

### Q6. How is the frontend structured?

Answer direction:

- Vite + React + TypeScript
- app shell under `/app`
- project workspace split into `Arch`, `Code`, and `Ship`
- floating architecture copilot widget
- backend-first project store with local fallback

### Q7. What is the hardest frontend part?

Answer direction:

- the architecture canvas
- it is a custom SVG editor with:
  - node layout
  - drag positioning
  - inline rename
  - symbol palette
  - connection editing
  - export support

## 4. Deployment And Enterprise

### Q8. Is the deployment flow enterprise-ready?

Answer direction:

- not fully yet
- current MVP can deploy supported Azure resources using Terraform from the backend host
- for enterprise readiness, deployment should move to a worker/job model with safer secret handling and RBAC

### Q9. What are the biggest enterprise gaps?

Answer direction:

- auth and SSO
- org/workspace isolation
- DB-backed persistence
- audit logs
- deployment worker isolation
- approval workflow

### Q10. Why is backend project persistence important?

Answer direction:

- local storage is fine for demos, but not for teams
- backend persistence enables:
  - shared state
  - history
  - restore
  - future collaboration

## 5. AI/ML

### Q11. Did you use ML models?

Answer direction:

- the product uses LLM-style reasoning for prompt understanding and chat
- it also includes a lightweight local classifier and pattern ranking layer
- it is not a fully trained production ML pipeline yet, but it already mixes AI and deterministic logic intentionally

### Q12. What would you add next for accuracy?

Answer direction:

- embedding-based retrieval over architecture patterns
- stronger architecture validation
- more domain packs
- trained domain/archetype classifier
- better post-generation scoring/reranking

## 6. Engineering Tradeoffs

### Q13. Why use a JSON project store first?

Answer direction:

- faster iteration
- simpler operational overhead during MVP phase
- enough to prove backend persistence, history, and restore before committing to a DB model

Then explain that the next step should be PostgreSQL or Cosmos DB.

### Q14. Why use a custom SVG board instead of Mermaid only?

Answer direction:

- Mermaid is fast for text-to-diagram, but weak for editor-like interactions
- the product needed:
  - fit-to-page boards
  - image-based nodes
  - drag repositioning
  - direct editing
  - richer export behavior

## 7. Review And Reflection

### Q15. If you had one more month, what would you improve first?

Answer direction:

1. auth + workspaces
2. DB-backed persistence
3. deployment worker isolation
4. stronger canvas editing
5. more accurate architecture validation

### Q16. What is the biggest technical lesson from this project?

Answer direction:

- architecture generators cannot be LLM-only if you want enterprise trust
- the strongest pattern is:
  - understand with AI
  - constrain with deterministic systems
  - validate before deploy

## 8. Strong Closing Answer

If an interviewer asks, “What are you most proud of in this project?” a strong answer is:

> I’m most proud that it’s not just a text demo. It connects prompt understanding, architecture generation, diagram editing, Terraform output, deployment planning, and project persistence in one product. The most important design choice was keeping the system hybrid instead of LLM-only, because that made the results more stable and more credible for enterprise use.
