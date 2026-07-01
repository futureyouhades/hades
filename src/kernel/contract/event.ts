/**
 * Event contract — MODULE_CONTRACT.md §6 (events).
 *
 * Modules MAY emit asynchronous events via context.emit() for progress,
 * telemetry, or lifecycle changes. Events are fire-and-forget notifications,
 * never a way to invoke another module (R6.4). ADR-001 #6 models streaming as a
 * sequence of events correlated by requestId, terminated by the final response.
 */

export interface ModuleEvent {
  moduleId: string;
  /** e.g. "progress", "state-changed", "warning". */
  type: string;
  /** Correlation when the event is tied to a request (ADR-001 #6). */
  requestId?: string;
  /** Serializable payload. Never carries secrets (R8.4). */
  data?: unknown;
}
