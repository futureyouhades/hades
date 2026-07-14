/**
 * Logging contract — MODULE_CONTRACT.md §8.
 *
 * Logging is uniform and structured so output from any module can be aggregated,
 * correlated, and tested. Modules log ONLY through the injected logger (R8.1);
 * logs are structured message+fields (R8.2), carry requestId when tied to a
 * request (R8.3), and never contain secrets or full sensitive payloads (R8.4).
 *
 * The interface lives in the contract because ModuleContext exposes it; the
 * concrete sink/implementation lives in kernel/logging and is swappable (R8.5).
 */

/** Always includes moduleId; requestId when available (§8). */
export type LogFields = Record<string, unknown>;

export interface Logger {
  debug(msg: string, fields?: LogFields): void;
  info(msg: string, fields?: LogFields): void;
  warn(msg: string, fields?: LogFields): void;
  error(msg: string, fields?: LogFields): void;
  /** Returns a logger with `fields` bound onto every subsequent line (§8). */
  child(fields: LogFields): Logger;
}
