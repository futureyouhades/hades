/**
 * Reusable contract conformance suite (plan §5) — THE GATE.
 *
 * Any module is run against this battery; in Phase 0 it is validated against the
 * echo module, and from Phase 1 every real module must pass it. Assertions are
 * transport-agnostic: requests are driven through the Transport port (so the
 * wire round-trip is exercised), and lifecycle/health are checked via the runner
 * the registry hands back — exactly the surfaces Commander will use.
 *
 * It asserts, for any conforming module:
 *  - lifecycle idempotency and re-initialization after stop (R2.2, §2);
 *  - healthCheck() never throws and is self-describing (R4.3, R4.4);
 *  - the capability manifest is complete and stable while RUNNING (R5.3);
 *  - an unknown capability yields a structured error, not a throw (R6.1, R7.1);
 *  - a non-serializable payload is rejected locally on the wire (ADR-001 #4);
 *  - requestId is echoed on every response (R6.3).
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type {
  HadesModule,
  JSONSchema,
  ModuleResponse,
  RequestContext,
} from "../../kernel/contract/index.js";
import { Kernel } from "../../kernel/index.js";
import { MemorySink } from "../support/memory-sink.js";

export interface ConformanceSpec {
  /** Display name for the describe block. */
  name: string;
  /** Build a FRESH module instance and its config for each test. */
  create(): {
    module: HadesModule;
    configSchema?: JSONSchema;
    configValues?: Record<string, unknown>;
  };
  /** A request the module is expected to handle successfully. */
  validRequest(): { capability: string; payload: unknown; context?: RequestContext };
}

export function runConformanceSuite(spec: ConformanceSpec): void {
  describe(`conformance: ${spec.name}`, () => {
    let kernel: Kernel;
    let moduleId: string;
    let counter: number;

    const nextRequestId = (): string => `conformance-${(counter += 1)}`;

    beforeEach(async () => {
      counter = 0;
      const created = spec.create();
      moduleId = created.module.id;
      kernel = new Kernel({
        sink: new MemorySink(),
        logLevel: "debug",
        clock: () => "1970-01-01T00:00:00.000Z",
      });
      kernel.install({
        module: created.module,
        ...(created.configSchema ? { configSchema: created.configSchema } : {}),
        ...(created.configValues ? { configValues: created.configValues } : {}),
      });
      await kernel.start(moduleId);
    });

    afterEach(async () => {
      await kernel.stopAll();
    });

    it("echoes requestId and succeeds on a valid request (R6.3)", async () => {
      const req = spec.validRequest();
      const requestId = nextRequestId();
      const res = await kernel.send(moduleId, {
        requestId,
        capability: req.capability,
        payload: req.payload,
        context: req.context ?? {},
      });
      expect(res.requestId).toBe(requestId);
      expect(res.ok).toBe(true);
    });

    it("returns a structured error (not a throw) for an unknown capability (R6.1)", async () => {
      const requestId = nextRequestId();
      const res = await kernel.send(moduleId, {
        requestId,
        capability: "__definitely_not_a_capability__",
        payload: {},
        context: {},
      });
      expect(res.ok).toBe(false);
      expect(res.requestId).toBe(requestId);
      assertStructuredError(res);
    });

    it("rejects a non-serializable payload locally on the wire (ADR-001 #4)", async () => {
      const requestId = nextRequestId();
      const res = await kernel.send(moduleId, {
        requestId,
        capability: spec.validRequest().capability,
        payload: { notSerializable: (): void => {} },
        context: {},
      });
      expect(res.ok).toBe(false);
      assertStructuredError(res);
    });

    it("has a self-describing healthCheck that never throws (R4.3, R4.4)", async () => {
      const runner = kernel.registry.get(moduleId);
      expect(runner).toBeDefined();
      const health = await runner!.healthCheck();
      expect(["healthy", "degraded", "unhealthy"]).toContain(health.state);
      expect(health.moduleId).toBe(moduleId);
      expect(Number.isFinite(Date.parse(health.checkedAt))).toBe(true);
    });

    it("exposes a complete capability manifest, stable while RUNNING (R5.3)", async () => {
      const runner = kernel.registry.get(moduleId)!;
      const first = runner.describeCapabilities();
      const second = runner.describeCapabilities();

      expect(first.moduleId).toBe(moduleId);
      expect(first.capabilities.length).toBeGreaterThan(0);
      for (const cap of first.capabilities) {
        expect(typeof cap.name).toBe("string");
        expect(cap.inputSchema).toBeTypeOf("object");
        expect(cap.outputSchema).toBeTypeOf("object");
      }
      // Stable across calls while running.
      expect(second).toEqual(first);
    });

    it("is idempotent and re-initializable across a stop/start cycle (R2.2, R2.4)", async () => {
      const runner = kernel.registry.get(moduleId)!;
      // Idempotent start while RUNNING.
      await expect(runner.start()).resolves.toBeUndefined();
      // Stop, then idempotent second stop.
      await runner.stop();
      await expect(runner.stop()).resolves.toBeUndefined();
      // Resources released and the module can run again — proves no terminal leak.
      await kernel.start(moduleId);
      const res = await kernel.send(moduleId, {
        requestId: nextRequestId(),
        capability: spec.validRequest().capability,
        payload: spec.validRequest().payload,
        context: {},
      });
      expect(res.ok).toBe(true);
    });
  });
}

function assertStructuredError(res: ModuleResponse): void {
  expect(res.error).toBeDefined();
  expect(typeof res.error?.code).toBe("string");
  expect(typeof res.error?.category).toBe("string");
  expect(typeof res.error?.message).toBe("string");
  expect(typeof res.error?.retryable).toBe("boolean");
}
