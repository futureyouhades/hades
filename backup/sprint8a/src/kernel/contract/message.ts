/**
 * Request/response message contract — MODULE_CONTRACT.md §6.
 *
 * All work flows through Commander. Modules are passive: they answer requests
 * and emit events, but never originate calls to other modules (R6.4).
 *
 * These shapes are also the logical wire contract frozen by ADR-001: field set,
 * `requestId` correlation, and absolute-deadline propagation (R6.2) must survive
 * a serialize→deserialize round-trip on every hop.
 */

/** Caller intent and limits accompanying a request (ADR-001 #3, R6.2). */
export interface RequestContext {
  /**
   * Absolute deadline as an ISO-8601 timestamp. Absolute (not a duration) so it
   * survives the wire without shared-clock tricks (ADR-001, R6.2). Optional:
   * absence means no caller-imposed deadline.
   */
  deadline?: string;
  /** Opaque authority scope for the work (resolved by the security layer). */
  authScope?: string;
  /** Free-form, serializable caller hints. Never carries secrets. */
  attributes?: Record<string, unknown>;
}

export interface ModuleRequest {
  /** Correlation id, propagated to logs (§8) and echoed on the response (R6.3). */
  requestId: string;
  /** Must match a declared Capability.name (R6.1). */
  capability: string;
  /** Validated against the capability's inputSchema before dispatch (R5.2). */
  payload: unknown;
  context: RequestContext;
}

/** Timing / provenance metadata attached to a response. Never carries secrets. */
export interface ResponseMeta {
  /** Wall-clock duration the module spent handling the request. */
  durationMs?: number;
  /** Free-form, serializable provenance (e.g. model used, tokens, cost). */
  [key: string]: unknown;
}

import type { ModuleError } from "./error.js";

export interface ModuleResponse {
  /** Echoes the request's requestId for correlation (R6.3). */
  requestId: string;
  ok: boolean;
  /** Present when ok; matches the capability's outputSchema (R5.2). */
  result?: unknown;
  /** Present when !ok (§7). */
  error?: ModuleError;
  meta?: ResponseMeta;
}
