import { describe, it, expect } from "vitest";
import { ModuleRunner } from "./runner.js";
import { ModuleState } from "./state.js";
import { LifecycleError } from "./lifecycle-error.js";
import { FakeModule } from "../../testing/support/fake-module.js";
import { makeTestContext } from "../../testing/support/test-context.js";
import { KernelErrorCode } from "../contract/index.js";

const fixedClock = (): string => "2026-06-30T00:00:00.000Z";

function runner(module: FakeModule): ModuleRunner {
  return new ModuleRunner(module, { clock: fixedClock });
}

describe("ModuleRunner — happy path", () => {
  it("walks REGISTERED → INITIALIZED → RUNNING → STOPPED", async () => {
    const mod = new FakeModule();
    const r = runner(mod);
    const { context } = makeTestContext();

    expect(r.currentState).toBe(ModuleState.REGISTERED);
    await r.init(context);
    expect(r.currentState).toBe(ModuleState.INITIALIZED);
    await r.start();
    expect(r.currentState).toBe(ModuleState.RUNNING);
    await r.stop();
    expect(r.currentState).toBe(ModuleState.STOPPED);

    expect(mod.calls).toMatchObject({ init: 1, start: 1, stop: 1 });
  });

  it("can be re-initialized after STOPPED", async () => {
    const mod = new FakeModule();
    const r = runner(mod);
    const { context } = makeTestContext();

    await r.init(context);
    await r.start();
    await r.stop();
    await r.init(context);

    expect(r.currentState).toBe(ModuleState.INITIALIZED);
    expect(mod.calls.init).toBe(2);
  });
});

describe("ModuleRunner — idempotency (R2.2)", () => {
  it("treats repeat calls in the target state as no-ops", async () => {
    const mod = new FakeModule();
    const r = runner(mod);
    const { context } = makeTestContext();

    await r.init(context);
    await r.init(context); // no-op
    await r.start();
    await r.start(); // no-op
    await r.stop();
    await r.stop(); // no-op

    expect(mod.calls).toMatchObject({ init: 1, start: 1, stop: 1 });
  });

  it("stop() on a never-initialized module is a no-op", async () => {
    const mod = new FakeModule();
    const r = runner(mod);
    await r.stop();
    expect(r.currentState).toBe(ModuleState.REGISTERED);
    expect(mod.calls.stop).toBe(0);
  });
});

describe("ModuleRunner — illegal transitions (R2.1)", () => {
  it("rejects start() before init()", async () => {
    const r = runner(new FakeModule());
    await expect(r.start()).rejects.toBeInstanceOf(LifecycleError);
    expect(r.currentState).toBe(ModuleState.REGISTERED);
  });

  it("rejects init() while RUNNING", async () => {
    const r = runner(new FakeModule());
    const { context } = makeTestContext();
    await r.init(context);
    await r.start();
    await expect(r.init(context)).rejects.toBeInstanceOf(LifecycleError);
  });
});

describe("ModuleRunner — failure capture (R7.2, R2.5)", () => {
  it("transitions to FAILED when init throws and surfaces the cause via health", async () => {
    const mod = new FakeModule("boom", {
      init: async () => {
        throw new Error("db unreachable");
      },
    });
    const r = runner(mod);
    const { context } = makeTestContext();

    await expect(r.init(context)).rejects.toBeInstanceOf(LifecycleError);
    expect(r.currentState).toBe(ModuleState.FAILED);

    const health = await r.healthCheck();
    expect(health.state).toBe("unhealthy");
    expect(health.message).toContain("threw");
    // The module's own healthCheck is NOT consulted once FAILED.
    expect(mod.calls.healthCheck).toBe(0);
  });

  it("FAILED is terminal: init/start rejected, stop tolerated", async () => {
    const mod = new FakeModule("boom", {
      start: async () => {
        throw new Error("port in use");
      },
    });
    const r = runner(mod);
    const { context } = makeTestContext();
    await r.init(context);
    await expect(r.start()).rejects.toBeInstanceOf(LifecycleError);
    expect(r.currentState).toBe(ModuleState.FAILED);

    await expect(r.init(context)).rejects.toBeInstanceOf(LifecycleError);
    await expect(r.stop()).resolves.toBeUndefined(); // tolerant no-op
    expect(r.currentState).toBe(ModuleState.FAILED);
  });

  it("times out a hanging lifecycle method → FAILED with TIMEOUT (R2.3)", async () => {
    const mod = new FakeModule("slow", {
      init: () => new Promise<void>(() => {}), // never resolves
    });
    const r = new ModuleRunner(mod, { clock: fixedClock, timeouts: { initMs: 20 } });
    const { context } = makeTestContext();

    await expect(r.init(context)).rejects.toMatchObject({
      moduleError: { code: KernelErrorCode.TIMEOUT },
    });
    expect(r.currentState).toBe(ModuleState.FAILED);
  });
});

describe("ModuleRunner — execute gating (R2.1, R7.1)", () => {
  it("returns a structured NOT_RUNNING error instead of throwing when not RUNNING", async () => {
    const mod = new FakeModule();
    const r = runner(mod);

    const res = await r.execute({
      requestId: "req-1",
      capability: "noop",
      payload: {},
      context: {},
    });

    expect(res.ok).toBe(false);
    expect(res.requestId).toBe("req-1");
    expect(res.error?.code).toBe(KernelErrorCode.NOT_RUNNING);
    expect(mod.calls.execute).toBe(0);
  });

  it("delegates execute() to the module when RUNNING", async () => {
    const mod = new FakeModule();
    const r = runner(mod);
    const { context } = makeTestContext();
    await r.init(context);
    await r.start();

    const res = await r.execute({
      requestId: "req-2",
      capability: "noop",
      payload: { hi: true },
      context: {},
    });

    expect(res.ok).toBe(true);
    expect(res.result).toEqual({ hi: true });
    expect(mod.calls.execute).toBe(1);
  });
});
