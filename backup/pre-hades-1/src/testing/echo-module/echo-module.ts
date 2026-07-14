/**
 * EchoModule — the Phase 0 acceptance vehicle (plan §6).
 *
 * A throwaway module with a single `echo` capability. It exists only to prove
 * the Kernel works end to end and to be the first subject of the conformance
 * suite. It is NOT a product module and will not ship in M1.
 *
 * Despite being trivial it is a *faithful* HadesModule: it reads config only
 * from context (R3.2), logs only through the injected logger with requestId
 * (§8), rejects unknown capabilities as structured data (R6.1/R7.1), honors the
 * request deadline (R6.2), and acquires/releases a real resource across
 * start()/stop() (R2.4) so resource discipline is observable.
 */

import type {
  CapabilityManifest,
  HadesModule,
  HealthStatus,
  JSONSchema,
  Logger,
  ModuleContext,
  ModuleRequest,
  ModuleResponse,
} from "../../kernel/contract/index.js";
import { KernelErrorCode } from "../../kernel/contract/index.js";

/** Self-declared config schema (R9.1). `prefix` is prepended to every echo. */
export const ECHO_CONFIG_SCHEMA: JSONSchema = {
  type: "object",
  properties: {
    prefix: { type: "string", description: "Prepended to each echoed message." },
  },
  additionalProperties: false,
};

const ECHO_CAPABILITY = "echo";

const ECHO_INPUT_SCHEMA: JSONSchema = {
  type: "object",
  required: ["message"],
  properties: { message: { type: "string" } },
  additionalProperties: false,
};

const ECHO_OUTPUT_SCHEMA: JSONSchema = {
  type: "object",
  required: ["echoed"],
  properties: { echoed: { type: "string" } },
  additionalProperties: false,
};

export class EchoModule implements HadesModule {
  readonly id = "echo";
  readonly name = "Echo Module";
  readonly version = "0.1.0";

  private logger: Logger | undefined;
  private emit: ModuleContext["emit"] | undefined;
  private prefix = "";
  /** A real, lifecycle-owned resource so stop()-releases-it is observable (R2.4). */
  private ticker: ReturnType<typeof setInterval> | undefined;

  async init(context: ModuleContext): Promise<void> {
    // Read config ONLY from context (R3.2); no env/file/global access.
    const prefix = context.config.values.prefix;
    this.prefix = typeof prefix === "string" ? prefix : "";
    this.logger = context.logger;
    this.emit = context.emit;
    this.logger.info("echo initialized", { prefix: this.prefix });
  }

  async start(): Promise<void> {
    // Acquire a resource on start (deferred from init per R1.1/§3 step 2).
    this.ticker = setInterval(() => {
      this.emit?.({ moduleId: this.id, type: "heartbeat" });
    }, 60_000);
    this.ticker.unref?.();
    this.logger?.info("echo started");
  }

  async stop(): Promise<void> {
    // Release every resource acquired since init (R2.4) — leave no leak.
    if (this.ticker !== undefined) {
      clearInterval(this.ticker);
      this.ticker = undefined;
    }
    this.logger?.info("echo stopped");
  }

  async healthCheck(): Promise<HealthStatus> {
    // Echo has no external dependency; it is healthy whenever running. The
    // result is self-describing (R4.4) and this never throws (R4.3).
    return {
      state: "healthy",
      moduleId: this.id,
      checkedAt: new Date().toISOString(),
      details: { self: { ok: true } },
    };
  }

  describeCapabilities(): CapabilityManifest {
    return {
      moduleId: this.id,
      capabilities: [
        {
          name: ECHO_CAPABILITY,
          description: "Echoes a message back, prefixed by the configured prefix.",
          inputSchema: ECHO_INPUT_SCHEMA,
          outputSchema: ECHO_OUTPUT_SCHEMA,
          tags: ["diagnostic"],
        },
      ],
      dependsOn: [],
      requires: [],
    };
  }

  async execute(request: ModuleRequest): Promise<ModuleResponse> {
    const log = this.logger?.child({ requestId: request.requestId });

    // R6.1/R7.1: unknown capability is structured data, never a throw.
    if (request.capability !== ECHO_CAPABILITY) {
      log?.warn("unknown capability", { capability: request.capability });
      return {
        requestId: request.requestId,
        ok: false,
        error: {
          code: KernelErrorCode.UNKNOWN_CAPABILITY,
          category: "validation",
          message: `unknown capability "${request.capability}"`,
          retryable: false,
        },
      };
    }

    // Minimal precondition check (full schema validation is the platform's job).
    const message = (request.payload as { message?: unknown } | null)?.message;
    if (typeof message !== "string") {
      return {
        requestId: request.requestId,
        ok: false,
        error: {
          code: "ECHO_BAD_PAYLOAD",
          category: "validation",
          message: "payload.message must be a string",
          retryable: false,
        },
      };
    }

    // R6.2: honor an already-expired deadline rather than do needless work.
    if (request.context.deadline !== undefined) {
      const deadlineMs = Date.parse(request.context.deadline);
      if (Number.isFinite(deadlineMs) && deadlineMs <= Date.now()) {
        return {
          requestId: request.requestId,
          ok: false,
          error: {
            code: KernelErrorCode.TIMEOUT,
            category: "timeout",
            message: "deadline already passed",
            retryable: false,
          },
        };
      }
    }

    log?.info("echo handled");
    return {
      requestId: request.requestId,
      ok: true,
      result: { echoed: `${this.prefix}${message}` },
      meta: { capability: ECHO_CAPABILITY },
    };
  }
}
