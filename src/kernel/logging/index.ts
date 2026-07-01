/**
 * Logging layer — structured logger + swappable sinks (MODULE_CONTRACT.md §8).
 */

export type { LogLevel, LogRecord, LogSink } from "./sink.js";
export { LOG_LEVEL_ORDER } from "./sink.js";
export { ConsoleSink } from "./console-sink.js";
export { StructuredLogger, type Clock, type StructuredLoggerOptions } from "./logger.js";
