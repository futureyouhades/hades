/**
 * Config loader — MODULE_CONTRACT.md §9, Phase 0 plan §4.5.
 *
 * Resolves secret references, then validates the resulting values against the
 * module's declared JSON Schema BEFORE init() (R9.1). Invalid config throws a
 * ConfigError and aborts — no degraded start. Modules receive config ONLY via
 * the ModuleConfig this produces (R9.2); they never read env/files themselves.
 *
 * The validator (Ajv) is an implementation detail hidden behind this loader so
 * it stays swappable (R10.6). Error text is sanitized to schema paths/keywords
 * and never echoes data values, so secrets cannot leak (R7.4, R9.3).
 */

import { Ajv, type ValidateFunction } from "ajv";
import type { JSONSchema, ModuleConfig } from "../contract/index.js";
import { ConfigError } from "./config-error.js";
import { isSecretRef, StubSecretsResolver, type SecretsResolver } from "./secrets.js";

export class ConfigLoader {
  private readonly ajv: Ajv;
  private readonly secrets: SecretsResolver;

  constructor(secrets: SecretsResolver = new StubSecretsResolver()) {
    // allErrors → report every problem at once; strict off → permissive schemas.
    this.ajv = new Ajv({ allErrors: true, strict: false });
    this.secrets = secrets;
  }

  /**
   * Produce a validated, immutable ModuleConfig for a module.
   *
   * @param schema  the module's self-declared config schema (R9.1, R9.5)
   * @param rawValues  resolved values that MAY contain `{ $secret: "KEY" }` refs
   * @throws ConfigError if a secret is unknown or values fail the schema
   */
  load(schema: JSONSchema, rawValues: Record<string, unknown>): ModuleConfig {
    const values = this.resolveSecrets(rawValues, "") as Record<string, unknown>;

    let validate: ValidateFunction;
    try {
      validate = this.ajv.compile(schema);
    } catch (err) {
      throw new ConfigError(
        "Module config schema is itself invalid",
        err instanceof Error ? err.message : String(err),
      );
    }

    if (!validate(values)) {
      const detail = (validate.errors ?? [])
        .map((e) => `${e.instancePath || "(root)"} ${e.message ?? "is invalid"}`.trim())
        .join("; ");
      throw new ConfigError("Resolved config failed schema validation", detail);
    }

    // Frozen: config is immutable for the module's lifetime (R9.4).
    return Object.freeze({ schema, values }) as ModuleConfig;
  }

  /** Walk the value tree replacing secret refs with resolved values (R9.3). */
  private resolveSecrets(value: unknown, path: string): unknown {
    if (isSecretRef(value)) {
      const resolved = this.secrets.resolve(value.$secret);
      if (resolved === undefined) {
        // Name the key location, never a value — there is none to leak anyway.
        throw new ConfigError(
          "Unresolved secret reference in config",
          `${path || "(root)"} → key "${value.$secret}"`,
        );
      }
      return resolved;
    }
    if (Array.isArray(value)) {
      return value.map((item, i) => this.resolveSecrets(item, `${path}[${i}]`));
    }
    if (typeof value === "object" && value !== null) {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value)) {
        out[k] = this.resolveSecrets(v, path ? `${path}.${k}` : k);
      }
      return out;
    }
    return value;
  }
}
