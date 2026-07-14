/**
 * Standard module interface — MODULE_CONTRACT.md §1, §3.
 *
 * Every Hades module exposes this exact surface; Commander interacts with all
 * modules through it with no special-casing. The five core methods are frozen
 * (R10.1) — new behavior arrives as new capabilities (§5), never new methods.
 */

import type { ModuleConfig } from "./config.js";
import type { Logger } from "./logger.js";
import type { ModuleEvent } from "./event.js";
import type { HealthStatus } from "./health.js";
import type { CapabilityManifest } from "./capability.js";
import type { ModuleRequest, ModuleResponse } from "./message.js";

/**
 * Injected at init() — the ONLY channel through which a module reads config,
 * logs, and emits events (R3.2, R8.1, §6). A module never reaches outside it.
 */
export interface ModuleContext {
  /** Resolved, validated config for THIS module (§9). */
  config: ModuleConfig;
  /** Pre-scoped logger for THIS module (§8). */
  logger: Logger;
  /** Outbound, fire-and-forget event channel to Commander (§6). */
  emit(event: ModuleEvent): void;
}

export interface HadesModule {
  // --- Identity (static, known before initialization) ---
  /** Stable, unique, kebab-case routing key (e.g. "model-router") (R1.3). */
  readonly id: string;
  readonly name: string;
  /** Semver of this module implementation (R10.2). */
  readonly version: string;

  // --- Lifecycle (§2) ---
  init(context: ModuleContext): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;

  // --- Introspection (§4, §5) ---
  healthCheck(): Promise<HealthStatus>;
  describeCapabilities(): CapabilityManifest;

  // --- Work (§6) ---
  execute(request: ModuleRequest): Promise<ModuleResponse>;
}
