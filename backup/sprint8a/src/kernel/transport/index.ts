/**
 * Transport layer — the Transport port, wire contract, and loopback adapter.
 */

export {
  type Transport,
  type TargetResolver,
  type RequestTarget,
  type EventHandler,
  type Unsubscribe,
} from "./transport.js";
export { InProcessTransport, type InProcessTransportOptions } from "./in-process.js";
export {
  encode,
  decode,
  roundTrip,
  assertWireSerializable,
  WireError,
  ENVELOPE_VERSION,
  type Envelope,
  type WireKind,
} from "./wire.js";
