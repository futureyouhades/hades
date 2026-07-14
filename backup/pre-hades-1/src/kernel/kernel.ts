/**
 * Kernel — the Phase 0 composition root.
 *
 * It owns no domain logic and makes no routing decisions (that is Commander's
 * job, Phase 2). It only *assembles* the platform: for each installed module it
 * builds a ModuleContext (validated config + scoped logger + an event channel
 * wired to the transport), wraps the module in a ModuleRunner (lifecycle), and
 * registers the runner for discovery. Requests flow exclusively over the
 * Transport port (ADR-001) — the Kernel never calls a module directly.
 *
 * This is the seam every later module (Memory, Model Router, Executors, and
 * finally Commander) plugs into without changing the Kernel.
 */

import type {
  HadesModule,
  JSONSchema,
  ModuleContext,
  ModuleEvent,
  ModuleRequest,
  ModuleResponse,
} from "./contract/index.js";
import { ConfigLoader } from "./config/index.js";
import type { SecretsResolver } from "./config/index.js";
import { ConsoleSink, StructuredLogger, type LogLevel, type LogSink } from "./logging/index.js";
import { ModuleRunner } from "./lifecycle/runner.js";
import type { LifecycleTimeouts } from "./lifecycle/index.js";
import { ModuleRegistry } from "./registry/index.js";
import {
  InProcessTransport,
  type EventHandler,
  type Transport,
  type Unsubscribe,
} from "./transport/index.js";

/** What the operator/bootstrap supplies to put a module under the Kernel. */
export interface ModuleInstallation {
  module: HadesModule;
  /** The module's config schema (R9.1). Defaults to an open object schema. */
  configSchema?: JSONSchema;
  /** Raw config values; may contain `{ $secret }` refs resolved by the loader. */
  configValues?: Record<string, unknown>;
  /** Per-module lifecycle timeout overrides (R2.3). */
  timeouts?: Partial<LifecycleTimeouts>;
}

export interface KernelOptions {
  logLevel?: LogLevel;
  sink?: LogSink;
  secrets?: SecretsResolver;
  /** Enforce wire round-trips in-process (default true, ADR-001 #4). */
  wireFidelity?: boolean;
  /** Injectable clock for deterministic timestamps in tests. */
  clock?: () => string;
}

export class Kernel {
  readonly registry: ModuleRegistry;
  readonly transport: Transport;

  private readonly rootLogger: StructuredLogger;
  private readonly configLoader: ConfigLoader;
  private readonly clock: () => string;
  private readonly contexts = new Map<string, ModuleContext>();

  constructor(options: KernelOptions = {}) {
    this.clock = options.clock ?? ((): string => new Date().toISOString());
    this.rootLogger = new StructuredLogger({
      sink: options.sink ?? new ConsoleSink(),
      level: options.logLevel ?? "info",
      clock: this.clock,
    });
    this.configLoader = new ConfigLoader(options.secrets);
    this.registry = new ModuleRegistry();
    this.transport = new InProcessTransport(this.registry, {
      ...(options.wireFidelity !== undefined ? { wireFidelity: options.wireFidelity } : {}),
    });
  }

  /**
   * Install a module: validate its config, build its context, wrap it in a
   * runner, and register it. Does NOT start it — lifecycle is explicit.
   */
  install(installation: ModuleInstallation): ModuleRunner {
    const { module } = installation;
    const config = this.configLoader.load(
      installation.configSchema ?? { type: "object" },
      installation.configValues ?? {},
    );

    const context: ModuleContext = {
      config,
      logger: this.rootLogger.child({ moduleId: module.id }),
      emit: (event: ModuleEvent): void => this.transport.publish(event),
    };

    const runner = new ModuleRunner(module, {
      clock: this.clock,
      ...(installation.timeouts ? { timeouts: installation.timeouts } : {}),
    });
    this.registry.register(runner);
    this.contexts.set(module.id, context);
    return runner;
  }

  /** Drive one module through init() then start(). */
  async start(id: string): Promise<void> {
    const runner = this.requireRunner(id);
    const context = this.contexts.get(id);
    if (context === undefined) throw new Error(`no context for module "${id}"`);
    await runner.init(context);
    await runner.start();
  }

  /** Start every installed module. */
  async startAll(): Promise<void> {
    for (const runner of this.registry.list()) {
      await this.start(runner.id);
    }
  }

  /** Stop every installed module (R2.4: each releases its resources). */
  async stopAll(): Promise<void> {
    for (const runner of this.registry.list()) {
      await runner.stop();
    }
  }

  /** Convenience: dispatch a request over the transport (ADR-001). */
  send(targetId: string, request: ModuleRequest): Promise<ModuleResponse> {
    return this.transport.send(targetId, request);
  }

  /** Observe the module event channel. */
  subscribe(handler: EventHandler): Unsubscribe {
    return this.transport.subscribe(handler);
  }

  private requireRunner(id: string): ModuleRunner {
    const runner = this.registry.get(id);
    if (runner === undefined) throw new Error(`module "${id}" is not installed`);
    return runner;
  }
}
