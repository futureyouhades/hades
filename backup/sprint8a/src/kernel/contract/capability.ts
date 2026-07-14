/**
 * Capability contract — MODULE_CONTRACT.md §5.
 *
 * A module advertises what it can do so Commander can plan and route with NO
 * hardcoded knowledge of any specific module (R5.1). The manifest is complete
 * and accurate after init() and stable while RUNNING (R5.3).
 */

import type { JSONSchema } from "./schema.js";

/** An external resource a module needs available (e.g. "qdrant", "ollama"). */
export interface ResourceClaim {
  /** Stable resource identifier the operator/infra layer understands. */
  name: string;
  /** Whether the module cannot start without it (vs. optional/degraded use). */
  required: boolean;
}

export interface Capability {
  /** Verb-like, stable name (e.g. "route-model", "recall-memory") (R5.1). */
  name: string;
  description: string;
  /** Shape of ModuleRequest.payload for this capability (R5.2). */
  inputSchema: JSONSchema;
  /** Shape of ModuleResponse.result for this capability (R5.2). */
  outputSchema: JSONSchema;
  /** Planning hints (e.g. "embedding", "llm", "browser"). */
  tags?: string[];
}

export interface CapabilityManifest {
  moduleId: string;
  capabilities: Capability[];
  /** Module ids this module needs available — startup ordering only (R5.4). */
  dependsOn: string[];
  /** External resources required (R5). */
  requires: ResourceClaim[];
}
