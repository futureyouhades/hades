/**
 * The Hades module contract — public surface.
 *
 * Pure types and stable value registries only. No behavior, no I/O (plan §4.1).
 * Everything a module or the Kernel needs to speak the contract is re-exported
 * here so callers import from one place: `kernel/contract`.
 */

export type { JSONSchema } from "./schema.js";
export type { ModuleError, ErrorCategory } from "./error.js";
export { KernelErrorCode } from "./error.js";
export type { HealthStatus, HealthState, CheckResult } from "./health.js";
export type { Capability, CapabilityManifest, ResourceClaim } from "./capability.js";
export type { ModuleRequest, ModuleResponse, RequestContext, ResponseMeta } from "./message.js";
export type { ModuleEvent } from "./event.js";
export type { ModuleConfig } from "./config.js";
export type { Logger, LogFields } from "./logger.js";
export type { HadesModule, ModuleContext } from "./module.js";
