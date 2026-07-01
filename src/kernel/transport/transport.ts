/**
 * Transport port — ADR-001 (#1 the seam, #2 discovery vs. invocation, #3 two
 * channels).
 *
 * Commander never invokes a module directly; it dispatches through this port,
 * keyed by module `id` as a location-transparent address (R1.3). The first and
 * only implementation today is InProcessTransport; HttpTransport / BusTransport
 * adapters can be added later without changing Commander or any module (R10.3).
 *
 * Two channels are modeled separately because their future transports differ:
 *  - request/response — synchronous, correlated by requestId, deadline-bound;
 *  - events — asynchronous, fire-and-forget (publish/subscribe).
 */

import type { ModuleEvent, ModuleRequest, ModuleResponse } from "../contract/index.js";

/** The minimal surface the transport needs to deliver a request to a module. */
export interface RequestTarget {
  execute(request: ModuleRequest): Promise<ModuleResponse>;
}

/**
 * Discovery seam (ADR-001 #2) — resolves an id to a deliverable target. Kept
 * separate from the transport so an id may later resolve to a remote ref with no
 * change to callers. The registry implements this.
 */
export interface TargetResolver {
  resolve(id: string): RequestTarget | undefined;
}

export type EventHandler = (event: ModuleEvent) => void;
export type Unsubscribe = () => void;

export interface Transport {
  /** Request/response channel: deliver `request` to `targetId`, await the reply. */
  send(targetId: string, request: ModuleRequest): Promise<ModuleResponse>;
  /** Event channel (in): a module emits a fire-and-forget event onto the bus. */
  publish(event: ModuleEvent): void;
  /** Event channel (out): observe events; returns an unsubscribe handle. */
  subscribe(handler: EventHandler): Unsubscribe;
}
