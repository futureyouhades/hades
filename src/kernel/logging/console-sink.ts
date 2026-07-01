/**
 * Default console sink (dev) — MODULE_CONTRACT.md R8.1.
 *
 * This is the ONE legitimate place a structured log line is written to a stream;
 * modules never write to stdout/stderr themselves. Output is newline-delimited
 * JSON on stderr so it is both human-greppable and machine-parseable, and so it
 * does not interleave with any stdout protocol surface (e.g. a future CLI).
 */

import type { LogRecord, LogSink } from "./sink.js";

export class ConsoleSink implements LogSink {
  write(record: LogRecord): void {
    const line = JSON.stringify({
      timestamp: record.timestamp,
      level: record.level,
      message: record.message,
      ...record.fields,
    });
    process.stderr.write(line + "\n");
  }
}
