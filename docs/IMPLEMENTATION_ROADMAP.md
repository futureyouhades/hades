# HADES IMPLEMENTATION ROADMAP

Version: 0.1 (Draft)

Status: Proposed

Related: `HADES_ARCHITECTURE.md`, `docs/MODULE_CONTRACT.md`, `CLAUDE.md`

---

## Product Vision

Hades is not merely an AI framework. The objective is an **autonomous AI
employee** that progressively takes over real work across:

- **Research** — gathering, verifying, and synthesizing information.
- **Business operations** — running recurring processes and back-office tasks.
- **Content creation** — writing and producing material.
- **Media generation** — images, audio, video and editing.
- **Automation** — wiring systems together and executing workflows unattended.
- **Decision support** — analysis and recommendations for the operator.

Two consequences fall out of this for the architecture, and they govern every
phase below:

1. **The tool layer is the product surface.** Autonomy is bounded by the tools
   Hades can wield. The Executor/tool subsystem must be an open ecosystem (see
   Phase 1c), not a fixed set.
2. **Security and authority are not optional.** An autonomous employee acts with
   real side effects (files, money, published content, infrastructure). The
   "Security by design" principle (`HADES_ARCHITECTURE.md`) becomes a hard
   constraint as soon as tools beyond `http-fetch` arrive: every tool runs under
   declared scope, with secrets resolved by the secrets layer (§9.3) and an
   auditable trail correlated by `requestId`.

---

## Operating Mode (effective now)

From this milestone forward Hades is built **MVP-first**:

- **Architecture stays clean.** Every component still implements the
  `HadesModule` contract and respects ADR-001 (transport seam, wire-fidelity).
  We do not earn velocity by violating the contract.
- **Implementation prioritizes business value.** We build the *thinnest vertical
  slice* that produces a working, demonstrable feature, then deepen it. Breadth
  (all providers, all agents, all tools) is deferred until the slice works
  end to end.
- **One slice, fully wired, beats five half-built modules.** Each phase must end
  in something runnable and observable, not just more interfaces.

This is a roadmap document only. **No application code is written here.**

---

## Milestone M1 — Commander Core

**Goal.** A working Commander Core that can orchestrate **memory, models, and
tools** for a single user request, end to end, in-process.

**Definition of done (the demo).** Given a natural-language request, Commander:

1. forms a plan,
2. recalls relevant long-term memory,
3. routes the generative step to a model via the Model Router,
4. optionally invokes one tool via an Executor,
5. returns a structured response, and
6. decides whether to persist new memory.

All of the above flows over the `Transport` port (in-process, serialized),
using capability-based routing only (R5.1) — Commander hardcodes no module
identity.

**Explicitly out of scope for M1** (deferred, not cancelled):

- Network transports (`HttpTransport` / `BusTransport`) — ADR-001 defers these.
- The full model matrix (OpenAI, Gemini, DeepSeek) — one provider first.
- Multi-agent orchestration beyond Commander + the three subsystems.
- Open WebUI *polish* and deep n8n workflow integration. (Open WebUI is
  *supported* in M1 per Confirmed Decision 4 — just not yet refined.)
- All tools beyond `http-fetch`; the ecosystem is *designed for* them in M1 but
  only one ships.
- At-least-once event delivery (Open Question 3 stays open; events are
  best-effort in M1 but ride a *pluggable* channel per ADR-001).

---

## Phase Plan

Each phase lists its goal, deliverables, the contract clauses it exercises, and
its acceptance criteria. Phases are sequential; each ends runnable.

### Phase 0 — The Kernel (platform every module plugs into)

**Goal.** The minimum platform that can load, validate, start, route to, health-
check, and stop a module — with nothing domain-specific yet.

**Deliverables (design-complete, then built next milestone):**

- **Contract types** — `HadesModule`, `ModuleContext`, request/response/event,
  `ModuleError`, `HealthStatus`, `CapabilityManifest` (§1, §3–§7).
- **Lifecycle engine** — the `REGISTERED → INITIALIZED → RUNNING → STOPPED /
  FAILED` state machine with timeouts and idempotency (§2).
- **`Transport` port + `InProcessTransport`** — with the mandatory
  serialize/deserialize round-trip on every message (ADR-001, keystone #4).
- **`ModuleRegistry`** — discovery by `id`, kept separate from transport
  (ADR-001 #2).
- **Config loader** — schema-validated, injected via `ModuleContext`; no module
  reads env/files directly (§9).
- **Structured logger** — injected, request-correlated, swappable sink (§8).

**Exercises:** §1, §2, §3, §8, §9; ADR-001 #1–#5.

**Acceptance:** a trivial throwaway "echo" module can be registered, initialized,
started, receive an `execute()` over `InProcessTransport` (serialized), report
health, and stop cleanly with no resource leak. Wire-fidelity test proves a
non-serializable payload is rejected locally.

---

### Phase 1 — The Three Subsystems (one capable slice each)

**Goal.** Stand up Memory, Model Router, and one Executor as real modules — each
the *thinnest useful* implementation, all behind the same contract.

**1a. Model Router (Claude primary, Ollama fallback)**
- Capability: `route-model` / `complete`.
- **Claude is the primary reasoning model.** **Ollama is the local fallback**
  (and the embedding provider for Memory, see 1b).
- Two providers ship in M1 (Claude + Ollama) behind the router's own provider
  abstraction, so adding OpenAI / Gemini / DeepSeek later is config + adapter,
  not a core change (R10.4). Fallback Claude→Ollama is driven by health and
  `error.retryable`, with the policy living in Commander (R7.3), not the router.
- Streaming modeled as `ModuleEvent`s terminated by the final response
  (ADR-001 #6) — wired even if the demo first consumes it non-streamed.

**1b. Memory Engine**
- Capabilities: `recall-memory`, `save-memory`.
- Backend: **Qdrant** (already in `infrastructure/docker-compose.yml`) +
  **Ollama embeddings** (per `HADES_ARCHITECTURE.md`).
- `healthCheck()` pings Qdrant for real (R4.2).

**1c. Executor Ecosystem (HTTP is the first tool, not the only model)**

This is an open, growing tool ecosystem — the product surface of the autonomous
employee. M1 ships exactly one tool, but the *framework* is built for many.

- **Tools enter as Executor modules.** Each tool (or coherent group of tools) is
  a `HadesModule` that declares its tool capabilities with input/output schemas
  (R5.2). Commander routes to them purely by capability (R5.1) — adding a tool
  never changes Commander (R10.4).
- **M1 tool:** a single low-risk **`http-fetch`** executor, to prove the tool
  path end to end without pulling in sandboxing or credential scope.
- **Designed-for roster (deferred, must fit with no contract change):**
  Browser, n8n, Python, File System, Docker, Git, CapCut, Hermes, Canva, and
  others. These span distinct runtime classes the framework must accommodate:
  - *Local processes / FS-touching:* Python, Git, File System, Docker, Shell.
  - *Long-lived services:* n8n, Docker, Browser.
  - *External SaaS (credentialed):* Canva, CapCut, Hermes.
  Their heterogeneity is the reason each is its own module: independent health,
  independent secrets scope, and — via ADR-001 — the option to run each in its
  own process/container (even polyglot, e.g. a Python executor) once a network
  transport exists.
- **Security as a first-class tool concern (from the second tool onward):**
  every executor declares the authority it needs; secrets are resolved by the
  secrets layer and never inlined (§9.3); every tool invocation is auditable via
  `requestId`. M1's `http-fetch` is deliberately chosen to defer this surface,
  but the Executor base contract reserves room for it now.

**Exercises:** §4, §5, §6, §7; R10.4 (providers/executors enter by contract).

**Acceptance:** each module passes a contract-conformance test suite (lifecycle,
health, capability manifest accuracy, structured errors, wire round-trip) in
isolation, with no Commander involved.

---

### Phase 2 — Commander Core (the orchestrator)

**Goal.** Commander plans and delegates across the three subsystems. Commander
performs no specialized work itself (CLAUDE.md Commander Rules; architecture
"Commander delegates").

**Deliverables:**

- **Intent → plan** — a minimal planner that decides, per request: recall memory?
  which capability for the generative step? a tool needed? save memory after?
- **Capability-based dispatch** — Commander resolves work to a `capability`,
  asks the registry which module serves it, and sends via `Transport`
  (R5.1, R6.x). No module identity is hardcoded.
- **Retry/fallback policy** — lives in Commander, driven by `error.retryable`
  and `health` (R7.3, §4 semantics).
- **Deadline propagation** — `context.deadline` set per request and honored
  across hops (R6.2).

**Exercises:** §5, §6, §7; the entire delegation model.

**Acceptance:** an integration test drives a request through
recall → route-model → (optional) tool → respond → save, asserting correlation
by `requestId` across every hop and correct behavior when a module reports
`degraded`/`unhealthy`.

---

### Phase 3 — Interfaces & Vertical Slice

**Goal.** Make M1 demonstrable through both supported interfaces.

**Two interfaces, two purposes:**

- **Open WebUI — officially supported end-user interface from the start.**
  Hades exposes an OpenAI-compatible HTTP endpoint that Open WebUI consumes, so
  Commander is reachable by the operator from day one. Kept functional (not yet
  polished), but supported, not a throwaway.
- **CLI — the development interface.** Fastest path to driving Commander during
  build and debugging; not the primary end-user surface.

**Deliverables:**

- The **OpenAI-compatible HTTP entry point** wired to Commander (for Open WebUI).
- A **dev CLI** that submits requests to Commander and renders responses + logs.
- A **scripted end-to-end demo** reproducing the Definition-of-Done flow.
- **Operational runbook** — bring up infra (`docker-compose`: Postgres, Qdrant,
  n8n + Open WebUI), required config/keys (Claude API key, Ollama), and how to
  run the demo through both interfaces.

**Acceptance:** the demo runs from a clean environment following only the runbook
and produces the orchestrated response **through Open WebUI** (and via the CLI),
with structured logs showing the full delegation path correlated by `requestId`.

---

## Cross-Cutting Constraints (apply to every phase)

- **Contract conformance is a gate.** A module is not "done" until it passes the
  shared conformance suite. This is how MVP speed stays compatible with clean
  architecture.
- **No hardcoded values** (§9) and **no direct module-to-module calls** (R1.2),
  even when in-process makes shortcuts available — wire-fidelity (ADR-001 #4)
  is the mechanical guard.
- **Schema-first** (R10.6): every capability ships input/output schemas, so
  validation, mocks, and docs are generated, not hand-maintained.

---

## Confirmed Decisions

Settled by the operator; they constrain M1 implementation.

1. **Primary reasoning model: Claude.** Ollama is the local fallback. (Phase 1a)
2. **Embeddings: Ollama.** Memory's embedding provider. (Phase 1b)
3. **First tool: `http-fetch`** — but the Executor subsystem is an open ecosystem
   designed for many future tools (Browser, n8n, Python, File System, Docker,
   Git, CapCut, Hermes, Canva, …) with no contract change. (Phase 1c)
4. **Open WebUI is an officially supported end-user interface from the start**
   (via an OpenAI-compatible endpoint); **CLI is the development interface.**
   (Phase 3)
5. **PostgreSQL remains available infrastructure** in M1 even if lightly used;
   it is the home for structured/operational state as the system grows. Vector
   memory stays in Qdrant.

---

## What Comes After M1 (preview, not committed)

- M2: Additional model providers + smarter routing (cost/latency-aware).
- M3: Additional executors (Python, browser, n8n workflows).
- M4: Multi-agent orchestration (the agent roster in `HADES_ARCHITECTURE.md`).
- M5: Network transport adapter (trigger: second node / independent scaling),
  unlocked cleanly by ADR-001.

---

## Summary

M1 delivers one clean vertical slice: Commander orchestrating memory, models, and
tools end to end, in-process, over the contract-defined transport. Architecture
discipline is preserved by the conformance gate and wire-fidelity; velocity comes
from going **deep on one slice** rather than wide across modules. No code has been
written; this roadmap is submitted for review alongside the updated
`MODULE_CONTRACT.md`.
