/**
 * Structured logger — MODULE_CONTRACT.md §8.
 *
 * Implements the contract Logger: structured (message + fields, R8.2), with
 * bound context via child() (R8.3), a configurable level threshold (R8.5), and
 * a swappable sink (R8.1). It holds no domain knowledge and performs no I/O of
 * its own — formatting and emission go through the injected sink.
 *
 * The clock is injected so tests get deterministic timestamps; production uses
 * the wall clock.
 */

import type { LogFields, Logger } from "../contract/logger.js";
import { LOG_LEVEL_ORDER, type LogLevel, type LogSink } from "./sink.js";

/** Returns an ISO-8601 timestamp. Injectable for deterministic tests. */
export type Clock = () => string;

const wallClock: Clock = () => new Date().toISOString();

export interface StructuredLoggerOptions {
  sink: LogSink;
  /** Minimum level to emit; lines below it are dropped (R8.5). */
  level: LogLevel;
  /** Fields bound onto every line produced by this logger. */
  fields?: LogFields;
  clock?: Clock;
}

export class StructuredLogger implements Logger {
  private readonly sink: LogSink;
  private readonly threshold: number;
  private readonly level: LogLevel;
  private readonly fields: LogFields;
  private readonly clock: Clock;

  constructor(options: StructuredLoggerOptions) {
    this.sink = options.sink;
    this.level = options.level;
    this.threshold = LOG_LEVEL_ORDER[options.level];
    this.fields = options.fields ?? {};
    this.clock = options.clock ?? wallClock;
  }

  debug(msg: string, fields?: LogFields): void {
    this.emit("debug", msg, fields);
  }

  info(msg: string, fields?: LogFields): void {
    this.emit("info", msg, fields);
  }

  warn(msg: string, fields?: LogFields): void {
    this.emit("warn", msg, fields);
  }

  error(msg: string, fields?: LogFields): void {
    this.emit("error", msg, fields);
  }

  child(fields: LogFields): Logger {
    return new StructuredLogger({
      sink: this.sink,
      level: this.level,
      fields: { ...this.fields, ...fields },
      clock: this.clock,
    });
  }

  private emit(level: LogLevel, message: string, fields?: LogFields): void {
    if (LOG_LEVEL_ORDER[level] < this.threshold) return;
    this.sink.write({
      level,
      message,
      timestamp: this.clock(),
      // Bound context first, per-call fields win on conflict.
      fields: { ...this.fields, ...fields },
    });
  }
}
