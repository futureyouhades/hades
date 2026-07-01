/**
 * ModuleRunner — drives a HadesModule through its lifecycle (§2).
 *
 * The runner is the canonical *handle* the registry stores and the transport
 * dispatches to. It owns everything the contract says the platform (not the
 * module) is responsible for:
 *
 *  - linear, explicit transitions (R2.1) with idempotent no-ops (R2.2);
 *  - per-method timeouts that drive the module to FAILED (R2.3);
 *  - catching throws from init/start/stop → FAILED (R7.2);
 *  - surfacing the failure cause via healthCheck() (R2.5);
 *  - gating execute() to RUNNING, returning a structured error otherwise (R2.1, R7.1).
 *
 * It knows nothing about what a module *does* — only how it transitions.
 */

import {
  KernelErrorCode,
  type CapabilityManifest,
  type HadesModule,
  type HealthStatus,
  type ModuleContext,
  type ModuleError,
  type ModuleRequest,
  type ModuleResponse,
} from "../contract/index.js";
import {
  IDEMPOTENT_IN,
  isLegalTransition,
  ModuleState,
  TARGET_STATE,
  type LifecycleAction,
} from "./state.js";
import { LifecycleError } from "./lifecycle-error.js";
import { DEFAULT_LIFECYCLE_TIMEOUTS, type LifecycleTimeouts } from "./timeouts.js";
import { withTimeout } from "./with-timeout.js";

/** Returns an ISO-8601 timestamp. Injectable for deterministic tests. */
export type Clock = () => string;

export interface ModuleRunnerOptions {
  timeouts?: Partial<LifecycleTimeouts>;
  clock?: Clock;
}

export class ModuleRunner {
  private readonly module: HadesModule;
  private readonly timeouts: LifecycleTimeouts;
  private readonly clock: Clock;
  private state: ModuleState = ModuleState.REGISTERED;
  private failure: ModuleError | undefined;

  constructor(module: HadesModule, options: ModuleRunnerOptions = {}) {
    this.module = module;
    this.timeouts = { ...DEFAULT_LIFECYCLE_TIMEOUTS, ...options.timeouts };
    this.clock = options.clock ?? ((): string => new Date().toISOString());
  }

  get id(): string {
    return this.module.id;
  }

  get currentState(): ModuleState {
    return this.state;
  }

  describeCapabilities(): CapabilityManifest {
    return this.module.describeCapabilities();
  }

  async init(context: ModuleContext): Promise<void> {
    await this.transition("init", this.timeouts.initMs, () => this.module.init(context));
  }

  async start(): Promise<void> {
    await this.transition("start", this.timeouts.startMs, () => this.module.start());
  }

  async stop(): Promise<void> {
    await this.transition("stop", this.timeouts.stopMs, () => this.module.stop());
  }

  /**
   * Health, lifecycle-aware (R2.5, R4.x):
   *  - FAILED → unhealthy, carrying the captured failure cause;
   *  - not RUNNING → unhealthy ("not accepting work");
   *  - RUNNING → delegate to the module, guarding the R4.3 "never throws" promise.
   */
  async healthCheck(): Promise<HealthStatus> {
    const base = { moduleId: this.module.id, checkedAt: this.clock() };

    if (this.state === ModuleState.FAILED) {
      return {
        ...base,
        state: "unhealthy",
        message: this.failure?.message ?? "module is in FAILED state",
        details: {
          lifecycle: { ok: false, ...(this.failure ? { error: this.failure.code } : {}) },
        },
      };
    }

    if (this.state !== ModuleState.RUNNING) {
      return {
        ...base,
        state: "unhealthy",
        message: `module is ${this.state}, not accepting work`,
      };
    }

    try {
      return await withTimeout(
        this.module.healthCheck(),
        this.timeouts.healthMs,
        () => new Error("healthCheck exceeded timeout"),
      );
    } catch (err) {
      // A module's healthCheck MUST NOT throw (R4.3); if it does, that itself is
      // an unhealthy signal rather than a crash of the monitor.
      return {
        ...base,
        state: "unhealthy",
        message: "healthCheck failed to complete",
        details: { probe: { ok: false, error: errText(err) } },
      };
    }
  }

  /** Gate execute() to RUNNING; reject as structured data, never a throw (R2.1, R7.1). */
  async execute(request: ModuleRequest): Promise<ModuleResponse> {
    if (this.state !== ModuleState.RUNNING) {
      return {
        requestId: request.requestId,
        ok: false,
        error: {
          code: KernelErrorCode.NOT_RUNNING,
          category: "dependency",
          message: `module "${this.module.id}" is ${this.state}, not RUNNING`,
          // The module may yet start — let Commander decide retry vs. fallback.
          retryable: true,
        },
      };
    }
    return this.module.execute(request);
  }

  private async transition(
    action: LifecycleAction,
    timeoutMs: number,
    work: () => Promise<void>,
  ): Promise<void> {
    // FAILED is terminal: stop() is a tolerant no-op; init/start are rejected.
    if (this.state === ModuleState.FAILED) {
      if (action === "stop") return;
      throw new LifecycleError({
        code: KernelErrorCode.NOT_RUNNING,
        category: "internal",
        message: `cannot ${action}: module "${this.module.id}" is FAILED and requires intervention`,
        retryable: false,
      });
    }

    // Idempotency (R2.2): already in the target state → no-op.
    if (this.state === IDEMPOTENT_IN[action]) return;

    // stop() on a never-initialized module: nothing was acquired, nothing to do.
    if (action === "stop" && this.state === ModuleState.REGISTERED) return;

    if (!isLegalTransition(action, this.state)) {
      throw new LifecycleError({
        code: KernelErrorCode.NOT_RUNNING,
        category: "internal",
        message: `illegal transition: cannot ${action} from ${this.state}`,
        retryable: false,
      });
    }

    try {
      await withTimeout(work(), timeoutMs, () => timeoutError(action, this.module.id, timeoutMs));
    } catch (err) {
      this.failure = toModuleError(err, action, this.module.id);
      this.state = ModuleState.FAILED;
      throw err instanceof LifecycleError ? err : new LifecycleError(this.failure);
    }

    this.state = TARGET_STATE[action];
  }
}

function timeoutError(action: LifecycleAction, moduleId: string, ms: number): LifecycleError {
  return new LifecycleError({
    code: KernelErrorCode.TIMEOUT,
    category: "timeout",
    message: `${action}() for module "${moduleId}" exceeded ${ms}ms`,
    retryable: false,
  });
}

function toModuleError(err: unknown, action: LifecycleAction, moduleId: string): ModuleError {
  if (err instanceof LifecycleError) return err.moduleError;
  // Surface a known ModuleError carried on a thrown app error (e.g. ConfigError).
  const carried = (err as { moduleError?: ModuleError }).moduleError;
  if (carried && typeof carried.code === "string") return carried;
  return {
    code: KernelErrorCode.NOT_RUNNING,
    category: "internal",
    message: `${action}() for module "${moduleId}" threw`,
    retryable: false,
    cause: errText(err),
  };
}

function errText(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
