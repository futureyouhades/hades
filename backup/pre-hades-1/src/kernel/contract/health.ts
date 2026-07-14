/**
 * Health contract — MODULE_CONTRACT.md §4.
 *
 * `healthCheck()` is the uniform signal Commander and the monitor use to learn
 * whether a module is fit for work. It MUST be cheap, side-effect-free, never
 * throw (R4.3), and self-describing (R4.4).
 */

/** Three-state liveness. See §4 semantics for routing implications. */
export type HealthState =
  | "healthy" // fully operational; safe to route all work
  | "degraded" // operational but impaired; route with caution
  | "unhealthy"; // MUST NOT receive work

/** Per-dependency probe result (e.g. one entry per backing service). */
export interface CheckResult {
  ok: boolean;
  latencyMs?: number;
  error?: string;
}

export interface HealthStatus {
  state: HealthState;
  moduleId: string;
  /** ISO-8601 timestamp (R4.4) — self-describing for logging/aggregation. */
  checkedAt: string;
  /** Per-dependency breakdown (e.g. Memory → qdrant). */
  details?: Record<string, CheckResult>;
  /** Human-readable summary, especially when not healthy. */
  message?: string;
}
