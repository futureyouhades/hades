/**
 * Configuration contract — MODULE_CONTRACT.md §9.
 *
 * Configuration is injected, validated, and never hardcoded (R9.1, R9.2). It is
 * immutable for the lifetime of an initialized module (R9.4). Secrets are
 * referenced by key and resolved by the secrets layer, never inlined (R9.3).
 */

import type { JSONSchema } from "./schema.js";

export interface ModuleConfig {
  /** The module's own config schema, self-declared (R9.1, R9.5). */
  schema: JSONSchema;
  /** Resolved values, already validated against `schema` by the loader (R9.1). */
  values: Record<string, unknown>;
}
