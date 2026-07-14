/**
 * Lifecycle state machine — MODULE_CONTRACT.md §2.
 *
 *   REGISTERED ──init()──▶ INITIALIZED ──start()──▶ RUNNING
 *        ▲                      │                      │
 *        │                      │ init() fails         │ stop()
 *        │                      ▼                      ▼
 *        └──────────────────  FAILED ◀──────────────  STOPPED
 *
 * Transitions are linear and explicit (R2.1). This module is pure data + a legal
 * -transition table; the runner (runner.ts) drives the actual transitions and
 * owns idempotency, timeouts, and failure capture.
 */

export const ModuleState = {
  REGISTERED: "REGISTERED",
  INITIALIZED: "INITIALIZED",
  RUNNING: "RUNNING",
  STOPPED: "STOPPED",
  FAILED: "FAILED",
} as const;

export type ModuleState = (typeof ModuleState)[keyof typeof ModuleState];

/** The three driven transitions. (FAILED is reached from any of them on error.) */
export type LifecycleAction = "init" | "start" | "stop";

/**
 * Source states from which an action is a *real* transition (not a no-op and not
 * illegal). Idempotent no-op cases (e.g. start() while RUNNING) and FAILED are
 * handled explicitly by the runner, not encoded here.
 */
const LEGAL_FROM: Record<LifecycleAction, readonly ModuleState[]> = {
  // init() boots a fresh module or re-inits a stopped one (STOPPED is re-usable).
  init: [ModuleState.REGISTERED, ModuleState.STOPPED],
  start: [ModuleState.INITIALIZED],
  // stop() is valid from anything holding (or about to hold) resources.
  stop: [ModuleState.INITIALIZED, ModuleState.RUNNING],
};

/** The state an action targets on success. */
export const TARGET_STATE: Record<LifecycleAction, ModuleState> = {
  init: ModuleState.INITIALIZED,
  start: ModuleState.RUNNING,
  stop: ModuleState.STOPPED,
};

/** The state an action would be a no-op in (already there) — idempotency (R2.2). */
export const IDEMPOTENT_IN: Record<LifecycleAction, ModuleState> = {
  init: ModuleState.INITIALIZED,
  start: ModuleState.RUNNING,
  stop: ModuleState.STOPPED,
};

export function isLegalTransition(action: LifecycleAction, from: ModuleState): boolean {
  return LEGAL_FROM[action].includes(from);
}
