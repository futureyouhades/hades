import { AgentManager } from "../agents/core/agent-manager.js";
import type { AgentTask, AgentResult } from "../agents/core/index.js";

import { HadesSearch } from "../search/index.js";
import { HadesBrowser } from "../browser/index.js";
import { SocialAgent } from "../social/index.js";
import { EmailAgent } from "../email/index.js";

export class HadesOrchestrator {
  private readonly manager = new AgentManager();

  constructor() {
    this.manager.register(new HadesSearch());
    this.manager.register(new HadesBrowser());
    this.manager.register(new SocialAgent());
    this.manager.register(new EmailAgent());
  }

  async execute(task: AgentTask): Promise<AgentResult> {
    return this.manager.execute(task);
  }
}
