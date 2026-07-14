import { describe, it, expect } from "vitest";
import { ConfigLoader } from "./loader.js";
import { ConfigError } from "./config-error.js";
import { StubSecretsResolver } from "./secrets.js";
import { KernelErrorCode } from "../contract/index.js";

const schema = {
  type: "object",
  required: ["greeting"],
  properties: {
    greeting: { type: "string" },
    retries: { type: "integer", minimum: 0 },
  },
  additionalProperties: false,
} as const;

describe("ConfigLoader", () => {
  it("returns a frozen, validated ModuleConfig for valid input", () => {
    const loader = new ConfigLoader();
    const config = loader.load(schema, { greeting: "hi", retries: 2 });

    expect(config.values).toEqual({ greeting: "hi", retries: 2 });
    expect(Object.isFrozen(config)).toBe(true);
  });

  it("throws ConfigError with CONFIG_INVALID code on schema violation (R9.1)", () => {
    const loader = new ConfigLoader();
    try {
      loader.load(schema, { retries: -1 });
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ConfigError);
      const ce = err as ConfigError;
      expect(ce.moduleError.code).toBe(KernelErrorCode.CONFIG_INVALID);
      expect(ce.moduleError.retryable).toBe(false);
      // Reports both the missing required field and the range violation.
      expect(ce.moduleError.cause).toContain("greeting");
    }
  });

  it("resolves secret references via the injected resolver (R9.3)", () => {
    const secrets = new StubSecretsResolver({ TOKEN: "s3cr3t" });
    const loader = new ConfigLoader(secrets);
    const withSecret = {
      type: "object",
      properties: { token: { type: "string" } },
    };

    const config = loader.load(withSecret, { token: { $secret: "TOKEN" } });

    expect(config.values.token).toBe("s3cr3t");
  });

  it("throws when a secret key is unknown, without leaking values", () => {
    const loader = new ConfigLoader(new StubSecretsResolver());
    try {
      loader.load({ type: "object" }, { token: { $secret: "MISSING" } });
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ConfigError);
      expect((err as ConfigError).moduleError.cause).toContain("MISSING");
    }
  });
});
