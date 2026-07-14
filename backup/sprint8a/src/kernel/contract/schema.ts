/**
 * Schema type — MODULE_CONTRACT.md R10.6 (schema-first contracts).
 *
 * Every capability and config block is described by a JSON Schema so validation,
 * docs, mocks, and fixtures can be generated rather than hand-maintained. We keep
 * this as a structural alias (a plain JSON object) rather than binding to a
 * specific validator's type, so the validator (Ajv today) stays swappable.
 */

/** A JSON Schema document. Structural by design — see R10.6. */
export type JSONSchema = Record<string, unknown>;
