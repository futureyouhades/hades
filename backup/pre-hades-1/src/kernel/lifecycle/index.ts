/**
 * Lifecycle layer — the module state machine and its runner (§2).
 */

export { ModuleState, type LifecycleAction, isLegalTransition } from "./state.js";
export { ModuleRunner, type ModuleRunnerOptions } from "./runner.js";
export { LifecycleError } from "./lifecycle-error.js";
export { DEFAULT_LIFECYCLE_TIMEOUTS, type LifecycleTimeouts } from "./timeouts.js";
export { withTimeout } from "./with-timeout.js";
