/**
 * Smoke test for the contract layer.
 *
 * The contract is pure types — there is almost nothing to execute. This test
 * does two things: (1) proves the value exports (the error-code registry) are
 * present and stable, and (2) acts as a compile-time assertion that the public
 * types can actually be assembled into the shapes the contract promises. If a
 * field is renamed or dropped, this file fails to type-check and `vitest run`
 * (which type-checks via esbuild/tsc) surfaces it.
 */

import { describe, it, expect } from "vitest";
import { KernelErrorCode } from "./index.js";
import type { HadesModule, ModuleResponse, HealthStatus, CapabilityManifest } from "./index.js";

describe("contract", () => {
  it("exposes a stable kernel error-code registry", () => {
    expect(KernelErrorCode.CONFIG_INVALID).toBe("CONFIG_INVALID");
    expect(KernelErrorCode.UNKNOWN_CAPABILITY).toBe("UNKNOWN_CAPABILITY");
    // Codes are their own string values — callers branch on them directly (R7.5).
    for (const [key, value] of Object.entries(KernelErrorCode)) {
      expect(value).toBe(key);
    }
  });

  it("composes a well-formed module surface (compile-time shape check)", () => {
    const manifest: CapabilityManifest = {
      moduleId: "sample",
      capabilities: [
        {
          name: "noop",
          description: "does nothing",
          inputSchema: { type: "object" },
          outputSchema: { type: "object" },
        },
      ],
      dependsOn: [],
      requires: [],
    };

    const health: HealthStatus = {
      state: "healthy",
      moduleId: "sample",
      checkedAt: "1970-01-01T00:00:00.000Z",
    };

    const module: HadesModule = {
      id: "sample",
      name: "Sample",
      version: "0.0.0",
      async init() {},
      async start() {},
      async stop() {},
      async healthCheck() {
        return health;
      },
      describeCapabilities() {
        return manifest;
      },
      async execute(request): Promise<ModuleResponse> {
        return { requestId: request.requestId, ok: true, result: request.payload };
      },
    };

    expect(module.id).toBe("sample");
    expect(module.describeCapabilities().capabilities[0]?.name).toBe("noop");
  });
});
