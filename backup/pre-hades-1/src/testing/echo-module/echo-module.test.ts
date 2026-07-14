import { describe, it, expect, vi } from "vitest";
import { EchoModule, ECHO_CONFIG_SCHEMA } from "./echo-module.js";
import { runConformanceSuite } from "../conformance/conformance.js";
import { Kernel } from "../../kernel/index.js";
import { KernelErrorCode } from "../../kernel/contract/index.js";
import { MemorySink } from "../support/memory-sink.js";

// 1) The reusable gate — the echo module must pass the full contract battery.
runConformanceSuite({
  name: "EchoModule",
  create: () => ({
    module: new EchoModule(),
    configSchema: ECHO_CONFIG_SCHEMA,
    configValues: { prefix: "" },
  }),
  validRequest: () => ({ capability: "echo", payload: { message: "hi" } }),
});

// Helper: a started Kernel hosting a fresh echo module.
async function bootEcho(configValues: Record<string, unknown> = {}): Promise<Kernel> {
  const kernel = new Kernel({
    sink: new MemorySink(),
    logLevel: "debug",
    clock: () => "1970-01-01T00:00:00.000Z",
  });
  kernel.install({ module: new EchoModule(), configSchema: ECHO_CONFIG_SCHEMA, configValues });
  await kernel.start("echo");
  return kernel;
}

describe("EchoModule — behavior", () => {
  it("applies the configured prefix from context (R3.2)", async () => {
    const kernel = await bootEcho({ prefix: "> " });
    const res = await kernel.send("echo", {
      requestId: "r1",
      capability: "echo",
      payload: { message: "world" },
      context: {},
    });
    expect(res.ok).toBe(true);
    expect(res.result).toEqual({ echoed: "> world" });
    await kernel.stopAll();
  });

  it("rejects an unknown capability with UNKNOWN_CAPABILITY (R6.1)", async () => {
    const kernel = await bootEcho();
    const res = await kernel.send("echo", {
      requestId: "r2",
      capability: "nope",
      payload: {},
      context: {},
    });
    expect(res.ok).toBe(false);
    expect(res.error?.code).toBe(KernelErrorCode.UNKNOWN_CAPABILITY);
    await kernel.stopAll();
  });

  it("rejects a non-string message as a validation error", async () => {
    const kernel = await bootEcho();
    const res = await kernel.send("echo", {
      requestId: "r3",
      capability: "echo",
      payload: { message: 42 },
      context: {},
    });
    expect(res.ok).toBe(false);
    expect(res.error?.category).toBe("validation");
    await kernel.stopAll();
  });

  it("honors an already-expired deadline (R6.2)", async () => {
    const kernel = await bootEcho();
    const res = await kernel.send("echo", {
      requestId: "r4",
      capability: "echo",
      payload: { message: "late" },
      context: { deadline: "2000-01-01T00:00:00.000Z" },
    });
    expect(res.ok).toBe(false);
    expect(res.error?.code).toBe(KernelErrorCode.TIMEOUT);
    await kernel.stopAll();
  });

  it("acquires a ticker on start and releases it on stop (R2.4)", async () => {
    const setSpy = vi.spyOn(globalThis, "setInterval");
    const clearSpy = vi.spyOn(globalThis, "clearInterval");
    const mod = new EchoModule();
    const kernel = new Kernel({ sink: new MemorySink(), clock: () => "1970-01-01T00:00:00.000Z" });
    kernel.install({ module: mod, configSchema: ECHO_CONFIG_SCHEMA, configValues: {} });

    await kernel.start("echo");
    expect(setSpy).toHaveBeenCalledTimes(1);

    await kernel.stopAll();
    expect(clearSpy).toHaveBeenCalledTimes(1);

    setSpy.mockRestore();
    clearSpy.mockRestore();
  });
});

describe("EchoModule — Phase 0 end-to-end (DoD #2)", () => {
  it("registers, starts, serves echo over the wire, reports health, stops clean", async () => {
    const kernel = await bootEcho({ prefix: "echo:" });

    // Serves an execute() over InProcessTransport with a real serialize round-trip.
    const payload = { message: "ping" };
    const res = await kernel.send("echo", {
      requestId: "e2e-1",
      capability: "echo",
      payload,
      context: {},
    });
    expect(res).toMatchObject({ requestId: "e2e-1", ok: true, result: { echoed: "echo:ping" } });

    // Reports health.
    const health = await kernel.registry.get("echo")!.healthCheck();
    expect(health.state).toBe("healthy");
    expect(health.moduleId).toBe("echo");

    // Capability is discoverable by name, not identity (R5.1).
    expect(kernel.registry.findByCapability("echo")).toEqual(["echo"]);

    // Stops cleanly; the runner reflects STOPPED.
    await kernel.stopAll();
    expect(kernel.registry.get("echo")!.currentState).toBe("STOPPED");
  });
});
