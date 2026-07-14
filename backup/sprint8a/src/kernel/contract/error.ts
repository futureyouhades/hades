/**
 * Error contract — MODULE_CONTRACT.md §7.
 *
 * Errors are data, not surprises. Modules return structured errors for expected
 * failures (R7.1) and reserve thrown exceptions for programmer/lifecycle errors
 * (R7.2). `code` values are stable and documented (R7.5).
 */

/** Coarse classification a caller can branch on without parsing prose (§7). */
export type ErrorCategory =
  | "config" // bad/missing configuration
  | "validation" // request failed schema/precondition checks
  | "dependency" // downstream resource failed (Qdrant, model API, etc.)
  | "timeout" // deadline exceeded
  | "internal"; // unexpected bug in the module

/** Structured, machine-readable error (R7.1, R7.4). Never carries secrets. */
export interface ModuleError {
  /** Stable, machine-readable identifier (e.g. "CONFIG_INVALID"). */
  code: string;
  category: ErrorCategory;
  /** Human-readable, sanitized — no secrets, no raw credentials (R7.4). */
  message: string;
  /** Honest retry hint so Commander can decide retry/fallback/abort (R7.3). */
  retryable: boolean;
  /** Sanitized underlying detail, optional. */
  cause?: string;
}

/**
 * Kernel-level error codes (R7.5). Domain modules add their own codes; these
 * are the ones the Kernel itself raises and the conformance suite asserts on.
 */
export const KernelErrorCode = {
  /** Resolved config failed schema validation (§9, R9.1). */
  CONFIG_INVALID: "CONFIG_INVALID",
  /** A lifecycle method exceeded its configured timeout (R2.3). */
  TIMEOUT: "TIMEOUT",
  /** execute() called while the module is not RUNNING (R2.1). */
  NOT_RUNNING: "NOT_RUNNING",
  /** Request named a capability the module did not declare (R6.1). */
  UNKNOWN_CAPABILITY: "UNKNOWN_CAPABILITY",
  /** A payload/result could not cross the wire boundary (ADR-001 #4). */
  WIRE_SERIALIZATION: "WIRE_SERIALIZATION",
  /** Transport could not resolve the target module id (R1.3). */
  UNKNOWN_TARGET: "UNKNOWN_TARGET",
} as const;

export type KernelErrorCode = (typeof KernelErrorCode)[keyof typeof KernelErrorCode];
