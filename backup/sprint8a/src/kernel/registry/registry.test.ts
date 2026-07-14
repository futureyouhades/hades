import { describe, it, expect } from "vitest";
import { ModuleRegistry } from "./registry.js";
import { ModuleRunner } from "../lifecycle/runner.js";
import { FakeModule } from "../../testing/support/fake-module.js";

function reg(): { registry: ModuleRegistry; a: ModuleRunner; b: ModuleRunner } {
  const registry = new ModuleRegistry();
  const a = new ModuleRunner(new FakeModule("a"));
  const b = new ModuleRunner(new FakeModule("b"));
  registry.register(a);
  registry.register(b);
  return { registry, a, b };
}

describe("ModuleRegistry", () => {
  it("registers and resolves by id", () => {
    const { registry, a } = reg();
    expect(registry.has("a")).toBe(true);
    expect(registry.get("a")).toBe(a);
    expect(registry.resolve("a")).toBe(a);
    expect(registry.resolve("missing")).toBeUndefined();
  });

  it("rejects duplicate ids", () => {
    const { registry } = reg();
    expect(() => registry.register(new ModuleRunner(new FakeModule("a")))).toThrow(
      /already registered/,
    );
  });

  it("lists all registered runners", () => {
    const { registry } = reg();
    expect(
      registry
        .list()
        .map((r) => r.id)
        .sort(),
    ).toEqual(["a", "b"]);
  });

  it("finds modules by declared capability, not identity (R5.1)", () => {
    const { registry } = reg();
    // FakeModule declares the "noop" capability.
    expect(registry.findByCapability("noop").sort()).toEqual(["a", "b"]);
    expect(registry.findByCapability("nonexistent")).toEqual([]);
  });
});
