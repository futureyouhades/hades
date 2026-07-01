import { describe, it, expect } from "vitest";
import { encode, decode, roundTrip, assertWireSerializable, WireError } from "./wire.js";
import { KernelErrorCode } from "../contract/index.js";

describe("wire — faithful values round-trip", () => {
  it("preserves nested JSON values across encode/decode", () => {
    const body = { a: 1, b: "x", c: [true, null, { d: 3.5 }], e: {} };
    expect(roundTrip("request", body)).toEqual(body);
  });

  it("returns a structurally-detached copy (no pass-by-reference)", () => {
    const body = { nested: { n: 1 } };
    const copy = roundTrip("response", body);
    expect(copy).toEqual(body);
    expect(copy).not.toBe(body);
    expect(copy.nested).not.toBe(body.nested);
  });

  it("stamps and verifies the envelope version", () => {
    const text = encode("event", { ok: true });
    expect(JSON.parse(text)).toMatchObject({ v: 1, kind: "event" });
    expect(decode(text)).toEqual({ ok: true });
  });

  it("rejects an unknown envelope version on decode", () => {
    const bad = JSON.stringify({ v: 999, kind: "request", body: {} });
    expect(() => decode(bad)).toThrow(WireError);
  });
});

describe("wire — non-serializable payloads are rejected locally (ADR-001 #4)", () => {
  const cases: Array<[string, unknown]> = [
    ["a function", { fn: (): void => {} }],
    ["undefined", { u: undefined }],
    ["a bigint", { b: 10n }],
    ["a symbol", { s: Symbol("x") }],
    ["NaN", { n: NaN }],
    ["Infinity", { i: Infinity }],
    ["a class instance", { d: new (class Foo {})() }],
  ];

  for (const [label, payload] of cases) {
    it(`rejects ${label}`, () => {
      expect(() => assertWireSerializable(payload)).toThrow(WireError);
    });
  }

  it("rejects circular references", () => {
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(() => assertWireSerializable(cyclic)).toThrow(WireError);
  });

  it("carries the WIRE_SERIALIZATION code", () => {
    try {
      assertWireSerializable({ fn: (): void => {} });
      expect.unreachable();
    } catch (err) {
      expect((err as WireError).moduleError.code).toBe(KernelErrorCode.WIRE_SERIALIZATION);
    }
  });
});
