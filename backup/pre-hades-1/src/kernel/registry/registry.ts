/**
 * ModuleRegistry — discovery by id (MODULE_CONTRACT.md R1.3, ADR-001 #2).
 *
 * The registry is pure discovery: it maps an id to its handle (the ModuleRunner)
 * and answers "who serves this capability?" for capability-based routing (R5.1).
 * It is deliberately separate from the transport (ADR-001 #2) so an id can later
 * resolve to a remote reference with no change to callers.
 *
 * It stores ModuleRunners — not raw modules — so that everything resolved
 * through it is already lifecycle-gated (execute() rejected unless RUNNING) and
 * health-aware (FAILED surfaced), per the runner.
 */

import type { RequestTarget, TargetResolver } from "../transport/transport.js";
import type { ModuleRunner } from "../lifecycle/runner.js";

export class ModuleRegistry implements TargetResolver {
  private readonly modules = new Map<string, ModuleRunner>();

  /** Register a runner under its module id. Duplicate ids are a programmer error. */
  register(runner: ModuleRunner): void {
    if (this.modules.has(runner.id)) {
      throw new Error(`module id "${runner.id}" is already registered`);
    }
    this.modules.set(runner.id, runner);
  }

  /** Discovery: full handle by id (for lifecycle/health management). */
  get(id: string): ModuleRunner | undefined {
    return this.modules.get(id);
  }

  /** TargetResolver: the delivery surface the transport needs (R1.3). */
  resolve(id: string): RequestTarget | undefined {
    return this.modules.get(id);
  }

  has(id: string): boolean {
    return this.modules.has(id);
  }

  list(): ModuleRunner[] {
    return [...this.modules.values()];
  }

  /**
   * Capability-based lookup (R5.1): the ids of every module declaring a
   * capability by this name. Commander routes on this, never on identity, which
   * is what makes modules replaceable.
   */
  findByCapability(capabilityName: string): string[] {
    const ids: string[] = [];
    for (const runner of this.modules.values()) {
      const serves = runner
        .describeCapabilities()
        .capabilities.some((c) => c.name === capabilityName);
      if (serves) ids.push(runner.id);
    }
    return ids;
  }
}
