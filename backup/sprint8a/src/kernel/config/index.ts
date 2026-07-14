/**
 * Config layer — schema-validated, secret-resolving config loader (§9).
 */

export { ConfigLoader } from "./loader.js";
export { ConfigError } from "./config-error.js";
export {
  StubSecretsResolver,
  isSecretRef,
  type SecretRef,
  type SecretsResolver,
} from "./secrets.js";
