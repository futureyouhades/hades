/**
 * Lifecycle timeouts — MODULE_CONTRACT.md R2.3.
 *
 * Each lifecycle method is bounded by a timeout; exceeding it transitions the
 * module to FAILED. Values are supplied via config (§9). Defaults are documented
 * here (R9.5) so a module that declares none still has a bounded, predictable
 * lifecycle rather than an implicit hang.
 */

export interface LifecycleTimeouts {
  initMs: number;
  startMs: number;
  stopMs: number;
  /** healthCheck() bound — short, since the monitor calls it frequently (R4.1). */
  healthMs: number;
}

/** Documented defaults (R9.5). Generous enough for real init, short enough to fail fast. */
export const DEFAULT_LIFECYCLE_TIMEOUTS: LifecycleTimeouts = {
  initMs: 10_000,
  startMs: 10_000,
  stopMs: 10_000,
  healthMs: 2_000,
};
