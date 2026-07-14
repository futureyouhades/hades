/**
 * Log sink — the swappable output boundary (MODULE_CONTRACT.md R8.1, R8.5).
 *
 * The logger formats structured records; the sink decides where they go. This
 * indirection is what keeps the sink swappable (console in dev, a network/file
 * sink later) without touching modules, and what keeps tests clean (a capturing
 * sink asserts on records instead of scraping stdout).
 */

import type { LogFields } from "../contract/logger.js";

export type LogLevel = "debug" | "info" | "warn" | "error";

/** Numeric order so a threshold can filter by severity (R8.5). */
export const LOG_LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

/** One fully-resolved structured log line (message + merged fields). */
export interface LogRecord {
  level: LogLevel;
  message: string;
  /** Bound + per-call fields merged; always includes moduleId when scoped. */
  fields: LogFields;
  /** ISO-8601 timestamp; injected by the logger via its clock. */
  timestamp: string;
}

export interface LogSink {
  write(record: LogRecord): void;
}
