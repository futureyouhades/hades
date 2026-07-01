/**
 * LifecycleError — thrown by the runner for illegal transitions and timeouts.
 *
 * R7.2 permits lifecycle methods to throw; the runner translates those throws
 * (and its own guard failures) into FAILED. This error carries a contract-shaped
 * ModuleError so the cause can be surfaced via healthCheck() (R2.5) uniformly.
 */

import type { ModuleError } from "../contract/index.js";

export class LifecycleError extends Error {
  readonly moduleError: ModuleError;

  constructor(moduleError: ModuleError) {
    super(moduleError.message);
    this.name = "LifecycleError";
    this.moduleError = moduleError;
  }
}
