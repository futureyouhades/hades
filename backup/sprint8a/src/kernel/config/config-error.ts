/**
 * ConfigError — MODULE_CONTRACT.md §9 / §3 (R9.1).
 *
 * Invalid config aborts startup; there is no degraded start. The loader runs
 * before init(), so it signals failure by THROWING (R7.2 allows lifecycle-time
 * throws). The error carries a contract-shaped ModuleError so the failure can be
 * surfaced and logged uniformly — and its message/cause never include secret
 * values (R7.4, R9.3).
 */

import { KernelErrorCode, type ModuleError } from "../contract/index.js";

export class ConfigError extends Error {
  readonly moduleError: ModuleError;

  constructor(message: string, cause?: string) {
    super(message);
    this.name = "ConfigError";
    this.moduleError = {
      code: KernelErrorCode.CONFIG_INVALID,
      category: "config",
      message,
      retryable: false,
      ...(cause !== undefined ? { cause } : {}),
    };
  }
}
