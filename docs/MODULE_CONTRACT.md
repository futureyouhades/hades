# HADES MODULE CONTRACT

Version: 0.1 (Draft — for review)

Status: Proposed

Related: `HADES_ARCHITECTURE.md`, `CLAUDE.md`

---

## Purpose

This document defines the single contract that **every** Hades module must
implement. Its goal is to make the architectural principles of Hades —
modular, independent, replaceable, testable — *enforceable* rather than
aspirational.

A "module" here means any first-class architectural component that Commander
can discover, configure, start, query, delegate to, and stop. Examples:
Model Router, Memory Engine, Agent Manager, and every Executor.

This is a **design document only**. The signatures shown are contract
specifications, not application code. No runtime, package, or dependency
decision is made here beyond what the contract requires.

### Design goals

- **One shape for all modules.** Commander interacts with every module
  through the same surface, with no special-casing.
- **No direct module-to-module coupling.** Modules depend on the *contract*,
  not on each other (Dependency Inversion).
- **Replaceability.** Any module can be swapped for another implementation of
  the same contract without changing callers.
- **Testability.** Every clause in this contract is observable and therefore
  mockable and assertable.

### Non-goals (deferred to later design docs)

- The concrete transport (in-process registry vs. HTTP vs. message bus).
- The configuration/secrets *loader* implementation (Phase 0).
- The logging *backend* (sink, format, rotation).
- Commander's planning algorithm.

This document defines the **interfaces and contracts** those later layers must
satisfy, not their implementations.

---

## 1. Standard Module Interface

Every Hades module MUST expose the following surface. The signatures are
language-neutral and illustrative; they describe *what* must exist, not *how*
it is built.

```
interface HadesModule {
  // Identity — static, known before initialization
  readonly id: string            // stable, unique, kebab-case (e.g. "model-router")
  readonly name: string          // human-readable
  readonly version: string       // semver of this module implementation

  // Lifecycle (see §2)
  init(context: ModuleContext): Promise<void>
  start(): Promise<void>
  stop(): Promise<void>

  // Introspection (see §4, §5)
  healthCheck(): Promise<HealthStatus>
  describeCapabilities(): CapabilityManifest

  // Work (see §6)
  execute(request: ModuleRequest): Promise<ModuleResponse>
}
```

### Rules

- **R1.1** A module MUST NOT perform any side effect (network, disk, spawning
  processes) before `init()` has completed successfully.
- **R1.2** A module MUST NOT import or call another module directly. All
  cross-module interaction goes through Commander (see §6).
- **R1.3** `id` MUST be stable across versions and unique within a running
  Hades instance. It is the key Commander uses for routing.
- **R1.4** Every method that performs I/O is asynchronous and MUST be safe to
  `await`. None may block the event loop indefinitely.
- **R1.5** The interface is closed for modification but open for extension:
  new capabilities are added via the capability manifest (§5), never by adding
  new required methods.

---

## 2. Module Lifecycle

Every module moves through a single, well-defined state machine. Commander
(via the Agent/Module manager) is the only actor allowed to drive transitions.

```
  REGISTERED ──init()──▶ INITIALIZED ──start()──▶ RUNNING
       ▲                      │                      │
       │                      │ init() fails         │ stop()
       │                      ▼                      ▼
       └──────────────────  FAILED ◀──────────────  STOPPED
```

| State        | Meaning                                                        |
|--------------|----------------------------------------------------------------|
| REGISTERED   | Known to the registry; no resources held.                      |
| INITIALIZED  | Config validated, dependencies resolved, ready to start.       |
| RUNNING      | Accepting `execute()` and `healthCheck()` calls.               |
| STOPPED      | Resources released; can be re-initialized.                     |
| FAILED       | Unrecoverable error during a transition; requires intervention.|

### Rules

- **R2.1** Transitions are linear and explicit. A module MUST reject
  `execute()` unless it is in RUNNING.
- **R2.2** Every lifecycle method MUST be **idempotent**: calling `stop()` on a
  STOPPED module is a no-op, not an error.
- **R2.3** Lifecycle methods MUST be bounded by a timeout (value supplied via
  config, §9). A method that exceeds its timeout transitions the module to
  FAILED.
- **R2.4** `stop()` MUST release every resource acquired since `init()`
  (connections, handles, timers) so the module leaves no leak behind.
- **R2.5** A FAILED module MUST surface the cause via `healthCheck()` and MUST
  NOT silently continue serving requests.

---

## 3. Initialization Process

`init(context)` is where a module becomes usable. It is deterministic and must
fail loudly rather than start in a degraded state.

```
interface ModuleContext {
  config: ModuleConfig          // resolved, validated config for THIS module (§9)
  logger: Logger                // pre-scoped logger for THIS module (§8)
  emit(event: ModuleEvent): void // outbound channel to Commander (§6)
}
```

### Ordered steps `init()` MUST perform

1. **Validate config** against the module's declared schema. Invalid config →
   throw `ConfigError`; do not continue.
2. **Resolve dependencies** (clients, drivers) — but do not yet open them if
   that constitutes a side effect; defer live connections to `start()` where
   practical.
3. **Register capabilities** so `describeCapabilities()` returns a complete,
   accurate manifest immediately after `init()`.
4. **Bind logger and event channel** from the context.
5. **Return** only when the module is genuinely ready to be started.

### Rules

- **R3.1** `init()` MUST be pure with respect to external state where possible:
  no writes, no irreversible actions.
- **R3.2** A module MUST NOT read configuration from any source other than
  `context.config`. This enforces "no hardcoded values" and keeps modules
  testable with injected config.
- **R3.3** `init()` MUST NOT depend on another module being initialized first.
  Ordering across modules is Commander's responsibility, expressed via declared
  dependencies in the capability manifest (§5), not via init-time coupling.

---

## 4. Health Check Contract

`healthCheck()` is the uniform way Commander and the monitor learn whether a
module is fit to receive work.

```
interface HealthStatus {
  state: "healthy" | "degraded" | "unhealthy"
  moduleId: string
  checkedAt: string             // ISO-8601 timestamp
  details?: Record<string, CheckResult>  // per-dependency breakdown
  message?: string              // human-readable summary, esp. when not healthy
}

interface CheckResult {
  ok: boolean
  latencyMs?: number
  error?: string
}
```

### Semantics

- **healthy** — fully operational; safe to route all work.
- **degraded** — operational but impaired (e.g. a fallback model in use, high
  latency); Commander MAY route with caution.
- **unhealthy** — MUST NOT receive work; Commander routes elsewhere or fails
  fast.

### Rules

- **R4.1** `healthCheck()` MUST be cheap, side-effect-free, and bounded by a
  short timeout. It is called frequently by the monitor.
- **R4.2** It MUST reflect real dependency state (e.g. Memory Engine pings
  Qdrant), not merely "process is alive".
- **R4.3** It MUST never throw. Failure to determine health IS an `unhealthy`
  result with an explanatory `message`.
- **R4.4** The result MUST be self-describing (`moduleId`, `checkedAt`) so it
  can be logged and aggregated without external context.

---

## 5. Capability Declaration

A module advertises what it can do so Commander can plan and route **without
hardcoded knowledge** of any specific module.

```
interface CapabilityManifest {
  moduleId: string
  capabilities: Capability[]
  dependsOn: string[]           // module ids this module needs available
  requires: ResourceClaim[]     // external resources (e.g. "qdrant", "ollama")
}

interface Capability {
  name: string                  // verb-like, stable (e.g. "route-model", "recall-memory")
  description: string
  inputSchema: JSONSchema       // shape of ModuleRequest.payload for this capability
  outputSchema: JSONSchema      // shape of ModuleResponse.result
  tags?: string[]               // hints for planning (e.g. "embedding", "llm", "browser")
}
```

### Rules

- **R5.1** Commander MUST route work based **only** on declared capabilities,
  never on a module's identity. This is what makes modules replaceable.
- **R5.2** Each capability MUST declare machine-readable input/output schemas so
  requests can be validated before dispatch and responses validated after.
- **R5.3** The manifest MUST be complete and accurate after `init()` and MUST
  NOT change while RUNNING. Capability changes require a new module version.
- **R5.4** `dependsOn` declares logical needs (used for startup ordering); it
  does NOT permit direct calls (R1.2 still holds).

---

## 6. Communication with Commander

All work flows through Commander. Modules are passive: they answer requests and
emit events, but they never originate calls to other modules.

### Request / Response (Commander → Module)

```
interface ModuleRequest {
  requestId: string             // correlation id, propagated to logs (§8)
  capability: string            // must match a declared Capability.name
  payload: unknown              // validated against capability.inputSchema
  context: RequestContext       // caller intent, auth scope, deadline
}

interface ModuleResponse {
  requestId: string
  ok: boolean
  result?: unknown              // present when ok; matches capability.outputSchema
  error?: ModuleError           // present when !ok (§7)
  meta?: ResponseMeta           // timing, model used, cost, tokens, etc.
}
```

### Events (Module → Commander)

Modules MAY emit asynchronous events via `context.emit()` for progress,
telemetry, or lifecycle changes. Events are **fire-and-forget notifications**,
never a way to invoke another module.

```
interface ModuleEvent {
  moduleId: string
  type: string                  // e.g. "progress", "state-changed", "warning"
  requestId?: string            // correlation when tied to a request
  data?: unknown
}
```

### Rules

- **R6.1** A module MUST reject any `ModuleRequest` whose `capability` it has
  not declared, returning a structured error (not a thrown exception).
- **R6.2** A module MUST honor `context.deadline`; work that cannot finish in
  time MUST return a timeout error rather than run unbounded.
- **R6.3** Every response MUST echo `requestId` for correlation.
- **R6.4** Modules MUST NOT call Commander synchronously for more work; the
  delegation direction is one-way (Commander decides; modules execute). This
  preserves Commander as the sole orchestrator.

---

## 7. Error Handling Contract

Errors are data, not surprises. Modules return structured errors for expected
failures and reserve thrown exceptions for programmer errors only.

```
interface ModuleError {
  code: string                  // stable, machine-readable (e.g. "CONFIG_INVALID")
  category: ErrorCategory
  message: string               // human-readable, no secrets
  retryable: boolean
  cause?: string                // sanitized underlying detail
}

type ErrorCategory =
  | "config"        // bad/missing configuration
  | "validation"    // request failed schema/precondition checks
  | "dependency"    // downstream resource failed (Qdrant, model API, etc.)
  | "timeout"       // deadline exceeded
  | "internal"      // unexpected bug in the module
```

### Rules

- **R7.1** Within `execute()`, expected failures MUST be returned as
  `ModuleResponse { ok: false, error }`, NOT thrown.
- **R7.2** Lifecycle methods (`init`/`start`/`stop`) MAY throw; the registry
  catches and transitions the module to FAILED.
- **R7.3** `retryable` MUST be set honestly so Commander can decide on retry vs.
  fallback vs. abort. Retry policy itself lives in Commander, not the module.
- **R7.4** Error messages and `cause` MUST be sanitized: no secrets, no API
  keys, no raw credentials (ties to §9 and the security principle).
- **R7.5** Error `code` values are stable and documented per module so callers
  and tests can branch on them without parsing prose.

---

## 8. Logging Contract

Logging is uniform and structured so output from any module can be aggregated,
correlated, and tested.

```
interface Logger {
  debug(msg: string, fields?: LogFields): void
  info(msg: string, fields?: LogFields): void
  warn(msg: string, fields?: LogFields): void
  error(msg: string, fields?: LogFields): void
  child(fields: LogFields): Logger     // returns a logger with bound context
}

type LogFields = Record<string, unknown>  // always includes moduleId; requestId when available
```

### Rules

- **R8.1** A module MUST log only through the injected `context.logger`. It MUST
  NOT write to stdout/stderr directly. This keeps the sink swappable and tests
  clean.
- **R8.2** Logs MUST be **structured** (message + fields), never string
  concatenation of variable data.
- **R8.3** Every log line tied to a request MUST carry `requestId` for
  end-to-end correlation across modules.
- **R8.4** Logs MUST NOT contain secrets or full payloads of sensitive data.
- **R8.5** Log **level thresholds** are configuration (§9), not compiled in.

---

## 9. Configuration Contract

Configuration is injected, validated, and never hardcoded — directly satisfying
the project's "no hardcoded values" rule.

```
interface ModuleConfig {
  schema: JSONSchema            // the module's own config schema (self-declared)
  values: Record<string, unknown>  // resolved values, already validated
}
```

### Rules

- **R9.1** Each module MUST declare a config **schema**. The loader (Phase 0)
  validates resolved values against it before `init()`; invalid config aborts
  startup with a `ConfigError`.
- **R9.2** Modules receive config **only** via `ModuleContext`. They MUST NOT
  read environment variables, files, or constants directly.
- **R9.3** Secrets (API keys, passwords) are referenced by key and resolved by
  the secrets layer; they MUST NOT appear in source, logs, errors, or events.
- **R9.4** Config is **immutable** for the lifetime of an initialized module. A
  config change requires a stop → re-init cycle.
- **R9.5** Every config value MUST have either a documented default or be marked
  required; there are no implicit defaults buried in code.

---

## 10. Future Extensibility Requirements

The contract is built to grow for years without breaking existing modules.

- **R10.1 — Capability-based growth.** New behavior is added as new
  *capabilities* in the manifest, never as new required interface methods. The
  five core methods (§1) are frozen.
- **R10.2 — Versioned modules and capabilities.** Both module `version` and
  individual capabilities are versioned so Commander can negotiate and run old
  and new implementations side by side.
- **R10.3 — Transport independence.** Because modules speak only `ModuleRequest`
  / `ModuleResponse` / `ModuleEvent`, the same module works whether the registry
  dispatches in-process today or over HTTP/a message bus later. No module change
  is required to switch transport. See **ADR-001** for how this is enforced
  (the `Transport` port and mandatory wire-fidelity).
- **R10.4 — New model providers and executors** (e.g. a future LLM, a new tool)
  enter the system purely by implementing `HadesModule` and declaring
  capabilities — no change to Commander's core.
- **R10.5 — Backward compatibility.** A change that alters an existing
  capability's input/output schema is a breaking change and MUST ship as a new
  capability or a new module version, never as a silent mutation.
- **R10.6 — Schema-first contracts.** Because requests, responses, capabilities,
  and config are all schema-described, tooling (validation, docs, mocks, test
  fixtures) can be generated rather than hand-maintained.

---

## Architectural Decisions

Decisions recorded here are settled. They constrain implementation and may only
be revisited via a new decision entry, never by silent drift in code.

### ADR-001 — Transport: design for the wire, run on the loopback

**Status:** Accepted (resolves Open Question 1.)

**Context.** R10.3 promises transport independence, but an in-process
implementation hands modules affordances a wire forbids (pass-by-reference
payloads, non-serializable `payload`/`result`, in-band exceptions, synchronous
event callbacks, shared-clock deadlines). If those creep in, "swap the transport
later" becomes a rewrite. Conversely, building HTTP/bus now would commit us to
transport choices before the requirements that should drive them (streaming,
event delivery guarantees) exist.

**Decision.** Specify the wire **contract** now; implement only an in-process
transport first, behind an explicit `Transport` port; defer — but do not skip —
the **design** of network transports. Concretely:

1. **`Transport` port (the seam).** Commander never invokes a module directly.
   It dispatches through a transport abstraction keyed by module `id` as a
   location-transparent address (R1.3). First and only implementation today:
   `InProcessTransport`. Future `HttpTransport` / `BusTransport` adapters are
   added without changing Commander or any module.
2. **Discovery is separate from invocation.** Resolving where an `id` lives
   (`ModuleRegistry.resolve`) is a distinct seam from moving a message there
   (`Transport.send`). Both resolve locally today; either may cross the network
   later with no change to module code.
3. **Two channels, decided now.** Request/response (synchronous, correlated by
   `requestId`, bounded by `context.deadline`) and events (asynchronous,
   fire-and-forget today) are modeled as separate transport surfaces, because
   their future transports differ (req/resp → HTTP/gRPC; events → bus/queue).
4. **Wire-fidelity enforced from day one (keystone).** Even the in-process
   transport serializes and deserializes every message (at least under a
   dev/test flag). This mechanically forbids the in-process shortcuts above by
   failing them in local tests rather than at distribution time.
5. **Fix the contract, keep the encoding swappable.** The logical wire contract
   (field set, `requestId` correlation, absolute deadline propagation,
   structured-error-not-throw, event shape) is frozen now. The encoding starts
   as JSON (debuggable, schema-validated) and may upgrade later (protobuf/
   msgpack) with no logical change, because every message is schema-described
   (R10.6). The wire envelope is versioned from message #1 (R10.2).
6. **Streaming anticipated.** Incremental output (e.g. Model Router token
   streaming, multi-agent progress) is modeled as a sequence of `ModuleEvent`s
   correlated by `requestId` and terminated by the final `ModuleResponse`, so
   the request/response surface stays clean and streaming needs no breaking
   change later.

**Consequences.** Defers all network/operational burden until a second node or
an independently-scaled module actually requires it, while guaranteeing those
adapters will work because every message has crossed a serialization boundary
since Phase 0. Couples to Open Question 2 (JSON Schema must be confirmed for the
swappable-encoding property) and Open Question 3 (the event channel must carry a
*pluggable* delivery guarantee so best-effort can upgrade to at-least-once
without a contract change).

---

## Open Questions (for review)

1. ~~**Transport timing**~~ — **Resolved by ADR-001.** Design the wire contract
   now; implement in-process behind a `Transport` port; defer network transport
   implementation.
2. **Schema language** — JSON Schema is assumed above for capability/config
   schemas. Confirm before Phase 0.
3. **Event delivery guarantees** — are module events best-effort only, or do we
   need an at-least-once channel for any of them?
4. **Health cadence** — should the monitor poll `healthCheck()`, should modules
   push health events, or both?

---

## Summary

This contract gives every Hades module one identity, one lifecycle, one health
signal, one capability manifest, one request/response/event shape, and one each
of error, logging, and configuration disciplines. Together they make modules
independent, replaceable, and testable — and keep Commander the single
orchestrator — exactly as `HADES_ARCHITECTURE.md` requires.

No application code, `package.json`, Node.js initialization, or Docker change
has been made. This document is submitted for review.
