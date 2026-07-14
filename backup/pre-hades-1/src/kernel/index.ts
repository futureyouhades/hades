/**
 * Hades Kernel — public entry point (Phase 0).
 *
 * The minimum platform that can load, validate, start, route to, health-check,
 * and stop a module under the HadesModule contract — with nothing
 * domain-specific. Everything below is exported so later modules (Memory, Model
 * Router, Executors, Commander) build against one surface.
 */

export * from "./contract/index.js";
export * from "./logging/index.js";
export * from "./config/index.js";
export * from "./lifecycle/index.js";
export * from "./transport/index.js";
export * from "./registry/index.js";
export { Kernel, type KernelOptions, type ModuleInstallation } from "./kernel.js";
