import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import prettier from "eslint-config-prettier";

export default [
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**"],
  },
  js.configs.recommended,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      // TypeScript checks these far better than ESLint's heuristics; the core
      // rules produce false positives on Node globals and value+type
      // co-declarations (the enum-like `const X` + `type X` pattern).
      "no-undef": "off",
      "no-redeclare": "off",
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": "error",
    },
  },
  {
    // Test utilities and specs: return-type annotations add noise without value,
    // and the console ban is irrelevant (they log through the kernel or not at all).
    files: ["src/testing/**/*.ts", "src/**/*.test.ts"],
    rules: {
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
  prettier,
];
