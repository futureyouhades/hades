/**
 * InProcessTransport — ADR-001's loopback implementation of the Transport port.
 *
 * Resolves a target via the registry (discovery, #2) and dispatches locally,
 * but every request, response, and event still crosses a real serialize→
 * deserialize boundary (wire-fidelity, #4). That round-trip is what guarantees
 * the future HttpTransport/BusTransport will "just work": no caller can lean on
 * pass-by-reference identity or smuggle a non-serializable payload through.
 *
 * Wire-fidelity is on by default (always in tests); it may be disabled on hot
 * paths in production via the constructor flag (plan §4.3) — the contract is
 * unchanged either way.
 */

import {
  KernelErrorCode,
  type ModuleEvent,
  type ModuleRequest,
  type ModuleResponse,
} from "../contract/index.js";
import {
  type EventHandler,
  type RequestTarget,
  type TargetResolver,
  type Transport,
  type Unsubscribe,
} from "./transport.js";
import { roundTrip, WireError } from "./wire.js";

export interface InProcessTransportOptions {
  /** Enforce serialize→deserialize on every message. Default true (ADR-001 #4). */
  wireFidelity?: boolean;
}

export class InProcessTransport implements Transport {
  private readonly resolver: TargetResolver;
  private readonly wireFidelity: boolean;
  private readonly handlers = new Set<EventHandler>();

  constructor(resolver: TargetResolver, options: InProcessTransportOptions = {}) {
    this.resolver = resolver;
    this.wireFidelity = options.wireFidelity ?? true;
  }

  async send(targetId: string, request: ModuleRequest): Promise<ModuleResponse> {
    const target: RequestTarget | undefined = this.resolver.resolve(targetId);
    if (target === undefined) {
      return errorResponse(request.requestId, {
        code: KernelErrorCode.UNKNOWN_TARGET,
        message: `no module registered for id "${targetId}"`,
      });
    }

    // Outbound: the request crosses the wire toward the module.
    let onWire: ModuleRequest;
    try {
      onWire = this.cross("request", request);
    } catch (err) {
      return wireFailure(request.requestId, err, "request");
    }

    const response = await target.execute(onWire);

    // Inbound: the response crosses the wire back toward the caller.
    try {
      return this.cross("response", response);
    } catch (err) {
      return wireFailure(request.requestId, err, "response");
    }
  }

  publish(event: ModuleEvent): void {
    let onWire: ModuleEvent;
    try {
      onWire = this.cross("event", event);
    } catch {
      // Events are fire-and-forget; a non-serializable event is dropped rather
      // than thrown back into the emitting module (R6 events are best-effort).
      return;
    }
    for (const handler of this.handlers) handler(onWire);
  }

  subscribe(handler: EventHandler): Unsubscribe {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  /** Apply the wire round-trip when fidelity is on; otherwise pass through. */
  private cross<T>(kind: "request" | "response" | "event", value: T): T {
    return this.wireFidelity ? roundTrip(kind, value) : value;
  }
}

function errorResponse(
  requestId: string,
  fields: { code: string; message: string },
): ModuleResponse {
  return {
    requestId,
    ok: false,
    error: { ...fields, category: "dependency", retryable: false },
  };
}

function wireFailure(requestId: string, err: unknown, side: string): ModuleResponse {
  const message = err instanceof WireError ? err.message : `${side} failed to cross the wire`;
  return {
    requestId,
    ok: false,
    error: {
      code: KernelErrorCode.WIRE_SERIALIZATION,
      category: "validation",
      message,
      retryable: false,
    },
  };
}
