/**
 * In-memory log sink for tests.
 *
 * Captures structured records so tests assert on logged fields/levels instead
 * of scraping stderr. Reused by the logger unit tests and the conformance suite.
 */

import type { LogRecord, LogSink } from "../../kernel/logging/index.js";

export class MemorySink implements LogSink {
  readonly records: LogRecord[] = [];

  write(record: LogRecord): void {
    this.records.push(record);
  }

  clear(): void {
    this.records.length = 0;
  }
}
