/**
 * Wire contract — ADR-001 (#4 keystone, #5 versioned envelope).
 *
 * Every request, response, and event crosses a real serialize→deserialize
 * boundary, even in-process. This mechanically forbids the in-process shortcuts
 * a wire forbids (pass-by-reference, non-serializable payloads, in-band
 * exceptions) by failing them LOCALLY, in tests, rather than at distribution
 * time.
 *
 * The logical contract is frozen now; the *encoding* is JSON today and may be
 * swapped later (protobuf/msgpack) with no logical change (ADR-001 #5). The
 * envelope is versioned from message #1 (R10.2).
 *
 * `JSON.stringify` is lossy/silent for some values (drops functions & undefined,
 * coerces NaN/Infinity to null) and throws cryptically for others (BigInt,
 * cycles). We pre-walk every value and reject anything that is not a faithful
 * JSON value, so "non-serializable" is a clear, local, testable failure.
 */

import { KernelErrorCode, type ModuleError } from "../contract/index.js";

export const ENVELOPE_VERSION = 1 as const;

export type WireKind = "request" | "response" | "event";

export interface Envelope<T> {
  /** Envelope version — present from message #1 (ADR-001 #5, R10.2). */
  v: number;
  kind: WireKind;
  body: T;
}

export class WireError extends Error {
  readonly moduleError: ModuleError;

  constructor(message: string, cause?: string) {
    super(message);
    this.name = "WireError";
    this.moduleError = {
      code: KernelErrorCode.WIRE_SERIALIZATION,
      category: "validation",
      message,
      retryable: false,
      ...(cause !== undefined ? { cause } : {}),
    };
  }
}

/**
 * Throw WireError unless `value` is a faithful JSON value. A faithful value is
 * null, a finite number, a boolean, a string, an array of faithful values, or a
 * plain object whose enumerable values are all faithful. Everything else
 * (undefined, function, symbol, bigint, NaN/Infinity, cyclic refs, class
 * instances with methods) is a wire violation.
 */
export function assertWireSerializable(value: unknown, path = "(root)"): void {
  walk(value, path, new Set());
}

function walk(value: unknown, path: string, seen: Set<object>): void {
  switch (typeof value) {
    case "string":
    case "boolean":
      return;
    case "number":
      if (!Number.isFinite(value)) {
        throw new WireError(`non-finite number is not serializable at ${path}`);
      }
      return;
    case "undefined":
      throw new WireError(`undefined is not serializable at ${path}`);
    case "function":
      throw new WireError(`function is not serializable at ${path}`);
    case "symbol":
      throw new WireError(`symbol is not serializable at ${path}`);
    case "bigint":
      throw new WireError(`bigint is not serializable at ${path}`);
    case "object": {
      if (value === null) return;
      if (seen.has(value)) {
        throw new WireError(`circular reference is not serializable at ${path}`);
      }
      seen.add(value);
      if (Array.isArray(value)) {
        value.forEach((item, i) => walk(item, `${path}[${i}]`, seen));
      } else {
        const proto = Object.getPrototypeOf(value);
        if (proto !== Object.prototype && proto !== null) {
          throw new WireError(`non-plain object is not serializable at ${path}`);
        }
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
          walk(v, `${path}.${k}`, seen);
        }
      }
      seen.delete(value);
      return;
    }
    default:
      throw new WireError(`unserializable value at ${path}`);
  }
}

/** Serialize a value into a versioned envelope string (the "send" side). */
export function encode<T>(kind: WireKind, body: T): string {
  assertWireSerializable(body, kind);
  const envelope: Envelope<T> = { v: ENVELOPE_VERSION, kind, body };
  return JSON.stringify(envelope);
}

/** Parse an envelope string back into its body (the "receive" side). */
export function decode<T>(text: string): T {
  let envelope: Envelope<T>;
  try {
    envelope = JSON.parse(text) as Envelope<T>;
  } catch (err) {
    throw new WireError("malformed wire envelope", err instanceof Error ? err.message : undefined);
  }
  if (envelope.v !== ENVELOPE_VERSION) {
    throw new WireError(`unsupported envelope version ${envelope.v}`);
  }
  return envelope.body;
}

/**
 * Encode then decode — the in-process wire-fidelity gate (ADR-001 #4). Returns a
 * structurally-detached copy of `body`, guaranteeing the caller cannot rely on
 * pass-by-reference identity across a hop.
 */
export function roundTrip<T>(kind: WireKind, body: T): T {
  return decode<T>(encode(kind, body));
}
