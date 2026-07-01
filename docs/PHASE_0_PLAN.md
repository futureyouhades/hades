# HADES — PHASE 0 IMPLEMENTATION PLAN (The Kernel)

Version: 1.0 (Approved — implementation in progress)

Status: **Approved — building.** The three §10 open items are now settled.

Related: `docs/IMPLEMENTATION_ROADMAP.md`, `docs/MODULE_CONTRACT.md` (incl.
ADR-001), `HADES_ARCHITECTURE.md`, `CLAUDE.md`

> **Confirmed decisions (resolve §10), operator sign-off 2026-06-30:**
> 1. **Runtime:** TypeScript on Node.js.
> 2. **Test runner / schema validator / linter:** Vitest + Ajv + ESLint/Prettier.
> 3. **Repo layout:** single package, `src/kernel/**` + `src/testing/**`. The
>    stale empty `hades-core/` placeholder dirs are retired.

---

## 1. Purpose & Scope

Phase 0 builds **the Kernel**: the minimum platform that can load, validate,
start, route to, health-check, and stop a module under the `HadesModule`
contract — with **nothing domain-specific** (no Claude, no Qdrant, no tools).

It is the foundation every later module plugs into. Its success is proven by a
throwaway `echo` module and a reusable **conformance test suite**, not by any
business feature.

**In scope:** contract types, lifecycle engine, `Transport` port +
`InProcessTransport` (with wire-fidelity), `ModuleRegistry`, config loader,
structured logger, conformance suite, echo module.

**Explicitly NOT in Phase 0:** Commander/planning, Model Router, Memory Engine,
any Executor/tool, Open WebUI/CLI entry points, network transport, Postgres/
Qdrant/Ollama clients. All deferred to Phase 1+.

---

## 2. Runtime & Tooling — Decision to Confirm

The contract's interfaces are written in TypeScript-flavored syntax and are
schema-first (JSON Schema). I recommend the Kernel be built in:

- **Language/runtime: TypeScript on Node.js.** Rationale: matches the contract
  signatures verbatim, first-class JSON-Schema tooling for the schema-first
  requirement (R10.6), strong async model for the lifecycle/transport, and it
  speaks the OpenAI-compatible HTTP surface Open WebUI expects (Phase 3). n8n is
  also Node, easing later integration.
- **Polyglot tools remain possible.** ADR-001's wire contract means future
  executors (e.g. a **Python** tool) can run as separate processes over a network
  transport later — the Kernel's language does not lock tools to one language.
- **Test runner / schema validator / linter:** to be pinned in the approved plan
  (recommend a single mainstream test runner + a standard JSON-Schema validator).

> **Confirm:** TypeScript/Node for the Kernel? (This is the one foundational
> choice I want explicit sign-off on before any scaffolding.)

---

## 3. Module / Package Structure (proposed)

Small files, one responsibility each (CLAUDE.md coding rules). Indicative layout:

```
src/
  kernel/
    contract/        # pure types & schemas — the HadesModule contract (§1,§3–§7)
      module.ts        # HadesModule, ModuleContext interfaces
      request.ts       # ModuleRequest/Response, RequestContext, ResponseMeta
      event.ts         # ModuleEvent
      error.ts         # ModuleError, ErrorCategory, error codes
      health.ts        # HealthStatus, CheckResult
      capability.ts    # CapabilityManifest, Capability
      config.ts        # ModuleConfig
    lifecycle/        # the state machine (§2)
      state.ts         # states + legal transitions
      runner.ts        # drives init/start/stop with timeouts + idempotency
    transport/        # ADR-001
      transport.ts     # Transport port (send + subscribe)
      in-process.ts    # InProcessTransport adapter
      wire.ts          # serialize/deserialize round-trip + envelope versioning
    registry/
      registry.ts      # ModuleRegistry: register/resolve by id (discovery seam)
    config/
      loader.ts        # schema-validated config injection (§9)
    logging/
      logger.ts        # structured, request-correlated logger interface
      console-sink.ts  # default swappable sink (dev)
  testing/
    conformance/      # the reusable contract conformance suite (the gate)
    echo-module/      # throwaway module proving the Kernel end to end
```

Exact filenames are illustrative; the principle (modular, small, testable) is
the commitment.

---

## 4. Component Specifications (responsibilities, not code)

### 4.1 Contract types (`kernel/contract`)
- Encode §1, §3–§7 interfaces exactly as the contract specifies.
- Pure type/schema declarations only — **no behavior, no I/O.**
- Stable error `code` registry per R7.5 begins here (kernel-level codes:
  `CONFIG_INVALID`, `TIMEOUT`, `NOT_RUNNING`, `UNKNOWN_CAPABILITY`, …).

### 4.2 Lifecycle engine (`kernel/lifecycle`)
- Implements `REGISTERED → INITIALIZED → RUNNING → STOPPED / FAILED` (§2).
- Enforces: linear transitions (R2.1), idempotency (R2.2), per-method timeouts
  → FAILED (R2.3), resource-release on stop (R2.4), failure cause surfaced via
  health (R2.5).
- Catches throws from `init/start/stop` and transitions to FAILED (R7.2).
- Knows nothing about what a module *does* — only how it transitions.

### 4.3 Transport port + InProcessTransport (`kernel/transport`) — ADR-001
- `Transport` port: `send(target, request) → Promise<ModuleResponse>` and
  `subscribe(handler)` for events — **two channels** (ADR-001 #3).
- `InProcessTransport`: resolves `target` via the registry and dispatches
  locally.
- **Wire-fidelity keystone (ADR-001 #4):** every request, response, and event
  passes through `wire.ts` serialize→deserialize **even in-process** (always in
  tests; behind a dev flag in hot paths). Non-serializable payloads fail here,
  locally, by design.
- Versioned envelope from message #1 (ADR-001 #5, R10.2). Encoding = JSON now,
  swappable later.
- Deadline propagated as an absolute value on the wire (R6.2) — never via
  shared-clock tricks.

### 4.4 ModuleRegistry (`kernel/registry`)
- Register a module under its `id`; resolve `id → handle` (R1.3).
- **Discovery only**, kept separate from transport (ADR-001 #2) so it can later
  resolve remote refs without touching callers.

### 4.5 Config loader (`kernel/config`)
- Validates resolved values against each module's declared schema before `init`
  (R9.1); invalid → `ConfigError`, abort (no degraded start, R3 intro).
- Injects config **only** via `ModuleContext` (R9.2); modules never read env/
  files directly.
- Secrets referenced by key, resolved by a secrets seam, never inlined/logged
  (R9.3). In Phase 0 the secrets resolver can be a trivial injectable stub —
  the *seam* exists now for the autonomous-employee tool security later.

### 4.6 Logger (`kernel/logging`)
- Structured (message + fields), request-correlated by `requestId` (§8).
- Injected via context; modules never write stdout/stderr directly (R8.1).
- Default console sink for dev; sink is swappable (R8.5 level thresholds via
  config). No secrets/full sensitive payloads (R8.4).

---

## 5. The Conformance Test Suite (the gate)

A **reusable** suite any module is run against — the mechanism that keeps
MVP velocity compatible with clean architecture. In Phase 0 it is built and
validated against the echo module; in Phase 1+ every real module must pass it.

It asserts, transport-agnostically:
- lifecycle legality, idempotency, and timeout→FAILED behavior;
- `healthCheck()` never throws and is self-describing (R4.3, R4.4);
- capability manifest is complete/accurate after init and stable while running
  (R5.3);
- unknown capability → structured error, not a throw (R6.1, R7.1);
- **wire round-trip:** a non-serializable payload is rejected locally (ADR-001);
- `requestId` is echoed on every response (R6.3);
- `stop()` releases resources (no leaked handles/timers, R2.4).

---

## 6. The Echo Module (acceptance vehicle)

A throwaway module under `testing/echo-module` that implements `HadesModule`
with a single `echo` capability. It exists solely to prove the Kernel works end
to end and to be the first subject of the conformance suite. It is **not** a
product module and will not ship in M1.

---

## 7. Testing Strategy

- **Unit tests** per kernel component (lifecycle transitions, wire round-trip,
  config validation, registry resolve, logger field binding).
- **Conformance tests** run the echo module through the full contract.
- **Negative tests** are first-class: invalid config, non-serializable payload,
  unknown capability, timeout, double-stop.
- Target: every contract clause referenced in §4–§5 has at least one assertion.

---

## 8. Phase 0 Definition of Done

Phase 0 is complete when:

1. All kernel components in §4 exist as small, single-responsibility modules.
2. The echo module registers, initializes, starts, serves an `echo` request
   **over `InProcessTransport` with a real serialize round-trip**, reports
   health, and stops with no leak.
3. The conformance suite passes against the echo module and is documented as the
   gate for all future modules.
4. A short `docs` note records how to run the suite and add a new module to it.
5. No domain logic, no network transport, no Postgres/Qdrant/Ollama/Claude —
   confirmed by review.

---

## 9. Risks & Mitigations

- **Risk: in-process shortcuts creep in.** *Mitigation:* wire-fidelity is on in
  all tests from the first commit (ADR-001 #4) — the suite fails such shortcuts.
- **Risk: Kernel over-engineering delays value.** *Mitigation:* Phase 0 ships
  only what the echo module needs to pass conformance; anything not exercised by
  a test is deferred.
- **Risk: secrets/auth design needed too early.** *Mitigation:* only the *seam*
  is added in Phase 0 (an injectable stub); real secret resolution arrives with
  the second tool (roadmap Phase 1c).

---

## 10. Open Items — RESOLVED (operator sign-off 2026-06-30)

1. ~~**Runtime**~~ — **TypeScript on Node.js.**
2. ~~**Test runner + JSON-Schema validator + linter**~~ — **Vitest + Ajv +
   ESLint/Prettier**, pinned in `package.json`.
3. ~~**Repo layout**~~ — **single package, `src/kernel/**` + `src/testing/**`.**
   The empty `hades-core/` placeholder dirs are retired.

Implementation order (each layer compiles + has at least a smoke test before the
next begins):

1. **Scaffold** — `package.json`, `tsconfig`, Vitest, ESLint/Prettier, `.gitignore`.
2. **Contract types** (`kernel/contract`) — pure types/schemas, no behavior.
3. **Logging** (`kernel/logging`) — needed by every other layer's context.
4. **Config loader** (`kernel/config`) — Ajv-backed schema validation.
5. **Lifecycle engine** (`kernel/lifecycle`) — the state machine + runner.
6. **Transport + wire** (`kernel/transport`) — `Transport` port, wire-fidelity,
   `InProcessTransport`.
7. **Registry** (`kernel/registry`) — discovery by `id`.
8. **Echo module** (`testing/echo-module`) — acceptance vehicle.
9. **Conformance suite** (`testing/conformance`) — the gate, validated against echo.
