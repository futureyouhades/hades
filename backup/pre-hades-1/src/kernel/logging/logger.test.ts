import { describe, it, expect } from "vitest";
import { StructuredLogger } from "./logger.js";
import { MemorySink } from "../../testing/support/memory-sink.js";

const fixedClock = (): string => "2026-06-30T00:00:00.000Z";

describe("StructuredLogger", () => {
  it("emits structured records with timestamp, level, message and fields", () => {
    const sink = new MemorySink();
    const log = new StructuredLogger({ sink, level: "debug", clock: fixedClock });

    log.info("hello", { requestId: "r1" });

    expect(sink.records).toHaveLength(1);
    expect(sink.records[0]).toEqual({
      level: "info",
      message: "hello",
      timestamp: "2026-06-30T00:00:00.000Z",
      fields: { requestId: "r1" },
    });
  });

  it("drops lines below the configured threshold (R8.5)", () => {
    const sink = new MemorySink();
    const log = new StructuredLogger({ sink, level: "warn", clock: fixedClock });

    log.debug("nope");
    log.info("nope");
    log.warn("yes");
    log.error("yes");

    expect(sink.records.map((r) => r.level)).toEqual(["warn", "error"]);
  });

  it("binds context via child() and lets per-call fields win on conflict (R8.3)", () => {
    const sink = new MemorySink();
    const root = new StructuredLogger({ sink, level: "debug", clock: fixedClock });
    const scoped = root.child({ moduleId: "echo" });

    scoped.info("a");
    scoped.info("b", { moduleId: "override", extra: 1 });

    expect(sink.records[0]?.fields).toEqual({ moduleId: "echo" });
    expect(sink.records[1]?.fields).toEqual({ moduleId: "override", extra: 1 });
  });

  it("child() inherits the threshold and sink", () => {
    const sink = new MemorySink();
    const root = new StructuredLogger({ sink, level: "error", clock: fixedClock });
    const scoped = root.child({ moduleId: "echo" });

    scoped.warn("filtered");
    scoped.error("kept");

    expect(sink.records.map((r) => r.message)).toEqual(["kept"]);
  });
});
