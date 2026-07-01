# HADES KERNEL — Developer Note (Phase 0)

Status: **Built.** Phase 0 of Milestone M1 (Commander Core) is complete.

Related: `docs/PHASE_0_PLAN.md`, `docs/MODULE_CONTRACT.md` (incl. ADR-001),
`docs/IMPLEMENTATION_ROADMAP.md`.

---

## What the Kernel is

The Kernel is the minimum platform every Hades module plugs into. It can load,
validate, start, route to, health-check, and stop a module under the
`HadesModule` contract — with **nothing domain-specific** (no Claude, no Qdrant,
no tools). Those arrive in Phase 1+.

It is proven end to end by a throwaway **echo module** and a reusable
**conformance suite** — not by any business feature.

---

## Layout

```
src/
  kernel/
    contract/    # pure types + schemas — the HadesModule contract (§1, §3–§9)
    logging/     # structured, request-correlated logger + swappable sink (§8)
    config/      # Ajv-validated config loader + secrets seam (§9)
    lifecycle/   # the state machine + ModuleRunner (timeouts, idempotency) (§2)
    transport/   # Transport port, wire-fidelity, InProcessTransport (ADR-001)
    registry/    # discovery by id and by capability (R1.3, R5.1)
    kernel.ts    # the composition root: wires context, lifecycle, transport
  testing/
    support/        # test doubles (fake module, memory sink, context builder)
    echo-module/    # the acceptance vehicle
    conformance/    # the reusable contract gate
```

## Tooling (confirmed in PHASE_0_PLAN §10)

- **TypeScript on Node.js** (`>=22`).
- **Vitest** test runner, **Ajv** JSON-Schema validator, **ESLint + Prettier**.

## Commands

```bash
npm install        # then, if esbuild's postinstall was blocked:
                   #   node node_modules/esbuild/install.js
npm test           # run the full suite (unit + conformance) once
npm run test:watch # watch mode
npm run typecheck  # tsc --noEmit (strict)
npm run lint       # eslint
npm run format     # prettier --write
```

---

## The conformance suite — the gate

`src/testing/conformance/conformance.ts` exports `runConformanceSuite(spec)`. It
drives a module **over the Transport port** (so the wire round-trip is
exercised) and asserts the contract clauses every module must satisfy:

- requestId is echoed on every response (R6.3);
- an unknown capability returns a **structured error, not a throw** (R6.1/R7.1);
- a non-serializable payload is **rejected locally on the wire** (ADR-001 #4);
- `healthCheck()` never throws and is self-describing (R4.3/R4.4);
- the capability manifest is complete and stable while RUNNING (R5.3);
- lifecycle is idempotent and re-initializable across stop/start (R2.2/R2.4).

**A module is not "done" until it passes this suite.** This is how MVP velocity
stays compatible with clean architecture.

---

## Adding a new module to the gate

1. Implement `HadesModule` (see `src/testing/echo-module/echo-module.ts` as the
   reference). Read config only from `context.config`, log only through
   `context.logger`, return errors as data, and release resources in `stop()`.
2. Declare a config schema and a capability manifest with input/output schemas.
3. Create a test file and call the gate:

   ```ts
   import { runConformanceSuite } from "../conformance/conformance.js";

   runConformanceSuite({
     name: "MyModule",
     create: () => ({
       module: new MyModule(),
       configSchema: MY_CONFIG_SCHEMA,
       configValues: {
         /* ... */
       },
     }),
     validRequest: () => ({ capability: "my-capability", payload: {} }),
   });
   ```

4. Add module-specific behavior tests alongside it.
5. Run `npm test`. Green = the module honors the contract.

---

## Running a module on the Kernel

```ts
import { Kernel } from "./src/kernel/index.js";
import { EchoModule, ECHO_CONFIG_SCHEMA } from "./src/testing/echo-module/echo-module.js";

const kernel = new Kernel({ logLevel: "info" });
kernel.install({
  module: new EchoModule(),
  configSchema: ECHO_CONFIG_SCHEMA,
  configValues: { prefix: "echo:" },
});
await kernel.start("echo");

const res = await kernel.send("echo", {
  requestId: "demo-1",
  capability: "echo",
  payload: { message: "hello" },
  context: {},
});
// res.result === { echoed: "echo:hello" }

await kernel.stopAll();
```

The Kernel makes **no routing decisions** — it only assembles the platform.
Capability-based planning and delegation arrive with Commander (Phase 2).

---

## What is intentionally NOT here (deferred to Phase 1+)

Commander/planning, Model Router, Memory Engine, any Executor/tool, Open WebUI /
CLI entry points, network transport, and Postgres/Qdrant/Ollama/Claude clients.
The wire contract (ADR-001) is frozen now so those land without a rewrite.
