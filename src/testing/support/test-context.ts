/**
 * Test ModuleContext builder.
 *
 * Assembles a real ModuleContext (logger + config + event capture) from the
 * actual kernel pieces, so tests exercise the same context shape modules see in
 * production rather than an ad-hoc mock.
 */

import type { ModuleConfig, ModuleContext, ModuleEvent } from "../../kernel/contract/index.js";
import { StructuredLogger } from "../../kernel/logging/index.js";
import { MemorySink } from "./memory-sink.js";

export interface TestContext {
  context: ModuleContext;
  sink: MemorySink;
  events: ModuleEvent[];
}

export function makeTestContext(config?: ModuleConfig): TestContext {
  const sink = new MemorySink();
  const events: ModuleEvent[] = [];
  const logger = new StructuredLogger({
    sink,
    level: "debug",
    clock: () => "1970-01-01T00:00:00.000Z",
  });

  const context: ModuleContext = {
    config: config ?? { schema: { type: "object" }, values: {} },
    logger,
    emit: (event: ModuleEvent): void => {
      events.push(event);
    },
  };

  return { context, sink, events };
}
