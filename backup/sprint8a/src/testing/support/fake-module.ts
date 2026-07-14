/**
 * Configurable HadesModule test double.
 *
 * Lets lifecycle/transport tests drive specific behaviors (throwing init, a
 * hanging start, a non-serializable result, …) without a real module. The echo
 * module is the *acceptance* vehicle; this is the *unit-test* vehicle.
 */

import type {
  CapabilityManifest,
  HadesModule,
  HealthStatus,
  ModuleContext,
  ModuleRequest,
  ModuleResponse,
} from "../../kernel/contract/index.js";

export interface FakeModuleHooks {
  init?: (context: ModuleContext) => Promise<void>;
  start?: () => Promise<void>;
  stop?: () => Promise<void>;
  healthCheck?: () => Promise<HealthStatus>;
  execute?: (request: ModuleRequest) => Promise<ModuleResponse>;
}

export class FakeModule implements HadesModule {
  readonly id: string;
  readonly name: string;
  readonly version = "0.0.0";

  readonly calls = { init: 0, start: 0, stop: 0, healthCheck: 0, execute: 0 };
  context: ModuleContext | undefined;

  private readonly hooks: FakeModuleHooks;

  constructor(id = "fake", hooks: FakeModuleHooks = {}) {
    this.id = id;
    this.name = `Fake ${id}`;
    this.hooks = hooks;
  }

  async init(context: ModuleContext): Promise<void> {
    this.calls.init += 1;
    this.context = context;
    await this.hooks.init?.(context);
  }

  async start(): Promise<void> {
    this.calls.start += 1;
    await this.hooks.start?.();
  }

  async stop(): Promise<void> {
    this.calls.stop += 1;
    await this.hooks.stop?.();
  }

  async healthCheck(): Promise<HealthStatus> {
    this.calls.healthCheck += 1;
    if (this.hooks.healthCheck) return this.hooks.healthCheck();
    return { state: "healthy", moduleId: this.id, checkedAt: "1970-01-01T00:00:00.000Z" };
  }

  describeCapabilities(): CapabilityManifest {
    return {
      moduleId: this.id,
      capabilities: [
        {
          name: "noop",
          description: "no-op capability",
          inputSchema: { type: "object" },
          outputSchema: { type: "object" },
        },
      ],
      dependsOn: [],
      requires: [],
    };
  }

  async execute(request: ModuleRequest): Promise<ModuleResponse> {
    this.calls.execute += 1;
    if (this.hooks.execute) return this.hooks.execute(request);
    return { requestId: request.requestId, ok: true, result: request.payload };
  }
}
