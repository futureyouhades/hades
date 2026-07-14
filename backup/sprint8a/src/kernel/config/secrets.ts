/**
 * Secrets seam — MODULE_CONTRACT.md R9.3 / Phase 0 plan §4.5.
 *
 * Secrets are referenced by KEY in raw config and resolved by this layer; the
 * literal value never appears in source, logs, errors, or events. Phase 0 ships
 * only the seam (an injectable stub) — real resolution (env/vault) arrives with
 * the second tool. Because resolution is an interface, swapping in a real
 * backend later changes no caller.
 */

/** A reference to a secret by key, e.g. `{ $secret: "CLAUDE_API_KEY" }`. */
export interface SecretRef {
  $secret: string;
}

export function isSecretRef(value: unknown): value is SecretRef {
  return (
    typeof value === "object" &&
    value !== null &&
    "$secret" in value &&
    typeof (value as Record<string, unknown>).$secret === "string"
  );
}

export interface SecretsResolver {
  /** Resolve a secret by key, or undefined if unknown. Never logs the value. */
  resolve(key: string): string | undefined;
}

/**
 * Trivial in-memory resolver for Phase 0 and tests. Holds a map of key→value
 * injected by the caller (the operator/bootstrap layer), nothing more.
 */
export class StubSecretsResolver implements SecretsResolver {
  private readonly secrets: ReadonlyMap<string, string>;

  constructor(secrets: Record<string, string> = {}) {
    this.secrets = new Map(Object.entries(secrets));
  }

  resolve(key: string): string | undefined {
    return this.secrets.get(key);
  }
}
