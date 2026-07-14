/**
 * Provider selection policy — the seam that decides routing order.
 *
 * ARCHITECTURAL NOTE. The roadmap (Confirmed Decision 1, R7.3) places
 * cross-module retry/fallback policy in Commander, not in a module. The Model
 * Router therefore owns only *which of its own providers* serve a request, and
 * in what order — expressed here as a replaceable `SelectionPolicy`. The default
 * `PrioritySelectionPolicy` realizes "Claude primary, Ollama fallback" by
 * priority. Commander (Phase 2) can inject a different policy — e.g. one that
 * returns a single provider — to centralize failover decisions, with no change
 * to the router or the providers.
 */

import type { ModelProvider } from "./provider.js";

export interface SelectionQuery {
  capability: string;
  /** Caller-pinned provider name, if any. */
  provider?: string | undefined;
  /** Caller-pinned model id, if any. */
  model?: string | undefined;
}

export interface SelectionPolicy {
  /** Ordered providers to attempt for this query; empty means none can serve it. */
  select(providers: ModelProvider[], query: SelectionQuery): ModelProvider[];
}

/**
 * Default policy: capability-filtered, priority-ordered, with optional
 * provider/model pinning. Lower `priority` is tried first, so the configured
 * primary leads and the fallback follows.
 */
export class PrioritySelectionPolicy implements SelectionPolicy {
  select(providers: ModelProvider[], query: SelectionQuery): ModelProvider[] {
    const byPriority = [...providers]
      .filter((p) => p.supports(query.capability))
      .sort((a, b) => a.priority - b.priority);

    if (query.provider !== undefined) {
      return byPriority.filter((p) => p.name === query.provider);
    }
    if (query.model !== undefined) {
      return byPriority.filter((p) => p.serves(query.model as string));
    }
    return byPriority;
  }
}
