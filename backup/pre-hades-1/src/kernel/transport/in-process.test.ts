import { describe, it, expect } from "vitest";
import { InProcessTransport } from "./in-process.js";
import type { RequestTarget, TargetResolver } from "./transport.js";
import type { ModuleRequest, ModuleResponse } from "../contract/index.js";
import { KernelErrorCode } from "../contract/index.js";

function resolverFor(targets: Record<string, RequestTarget>): TargetResolver {
  return { resolve: (id) => targets[id] };
}

const baseRequest = (overrides: Partial<ModuleRequest> = {}): ModuleRequest => ({
  requestId: "req-1",
  capability: "echo",
  payload: { msg: "hi" },
  context: {},
  ...overrides,
});

describe("InProcessTransport — delivery", () => {
  it("routes a request to the resolved target and returns its response", async () => {
    const echo: RequestTarget = {
      execute: async (req): Promise<ModuleResponse> => ({
        requestId: req.requestId,
        ok: true,
        result: req.payload,
      }),
    };
    const transport = new InProcessTransport(resolverFor({ echo }));

    const res = await transport.send("echo", baseRequest());
    expect(res.ok).toBe(true);
    expect(res.result).toEqual({ msg: "hi" });
    expect(res.requestId).toBe("req-1");
  });

  it("returns UNKNOWN_TARGET when the id resolves to nothing", async () => {
    const transport = new InProcessTransport(resolverFor({}));
    const res = await transport.send("missing", baseRequest());
    expect(res.ok).toBe(false);
    expect(res.error?.code).toBe(KernelErrorCode.UNKNOWN_TARGET);
  });

  it("delivers a detached copy of the request (wire-fidelity, no shared refs)", async () => {
    const sent = baseRequest();
    let received: ModuleRequest | undefined;
    const target: RequestTarget = {
      execute: async (req): Promise<ModuleResponse> => {
        received = req;
        return { requestId: req.requestId, ok: true };
      },
    };
    const transport = new InProcessTransport(resolverFor({ target }));

    await transport.send("target", sent);
    expect(received).toEqual(sent);
    expect(received).not.toBe(sent);
    expect(received?.payload).not.toBe(sent.payload);
  });
});

describe("InProcessTransport — wire-fidelity failures (ADR-001 #4)", () => {
  it("rejects a non-serializable request payload locally", async () => {
    const target: RequestTarget = {
      execute: async (req): Promise<ModuleResponse> => ({ requestId: req.requestId, ok: true }),
    };
    const transport = new InProcessTransport(resolverFor({ target }));

    const res = await transport.send("target", baseRequest({ payload: { fn: (): void => {} } }));
    expect(res.ok).toBe(false);
    expect(res.error?.code).toBe(KernelErrorCode.WIRE_SERIALIZATION);
  });

  it("rejects a non-serializable response from the module locally", async () => {
    const bad: RequestTarget = {
      execute: async (req): Promise<ModuleResponse> => ({
        requestId: req.requestId,
        ok: true,
        result: { fn: (): void => {} },
      }),
    };
    const transport = new InProcessTransport(resolverFor({ bad }));

    const res = await transport.send("bad", baseRequest());
    expect(res.ok).toBe(false);
    expect(res.error?.code).toBe(KernelErrorCode.WIRE_SERIALIZATION);
  });

  it("passes references through when wireFidelity is disabled", async () => {
    const sent = baseRequest();
    let received: ModuleRequest | undefined;
    const target: RequestTarget = {
      execute: async (req): Promise<ModuleResponse> => {
        received = req;
        return { requestId: req.requestId, ok: true };
      },
    };
    const transport = new InProcessTransport(resolverFor({ target }), { wireFidelity: false });

    await transport.send("target", sent);
    expect(received).toBe(sent);
  });
});

describe("InProcessTransport — event channel", () => {
  it("delivers published events to subscribers and honors unsubscribe", () => {
    const transport = new InProcessTransport(resolverFor({}));
    const seen: string[] = [];
    const unsub = transport.subscribe((e) => seen.push(e.type));

    transport.publish({ moduleId: "m", type: "progress" });
    unsub();
    transport.publish({ moduleId: "m", type: "ignored" });

    expect(seen).toEqual(["progress"]);
  });

  it("drops a non-serializable event rather than throwing (best-effort)", () => {
    const transport = new InProcessTransport(resolverFor({}));
    const seen: string[] = [];
    transport.subscribe((e) => seen.push(e.type));

    expect(() =>
      transport.publish({ moduleId: "m", type: "bad", data: { fn: (): void => {} } }),
    ).not.toThrow();
    expect(seen).toEqual([]);
  });
});
