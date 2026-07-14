import type { HadesAgent } from "./agent.js";
import type { AgentTask, AgentResult } from "./types.js";

export class AgentManager {
  private readonly agents: HadesAgent[] = [];

  register(agent: HadesAgent): void {
    this.agents.push(agent);
  }

  findAgent(task: AgentTask): HadesAgent | undefined {
    return this.agents.find((agent) => agent.canHandle(task));
  }

  async execute(task: AgentTask): Promise<AgentResult> {
    const agent = this.findAgent(task);

    if (!agent) {
      return {
        success: false,
        agent: "AgentManager",
        output: null,
        error: "Nie znalazłem odpowiedniego agenta do wykonania tego zadania.",
      };
    }

    try {
      return await agent.execute(task);
    } catch (error) {
      return {
        success: false,
        agent: agent.name,
        output: null,
        error:
          error instanceof Error
            ? error.message
            : "Nieznany błąd podczas wykonywania agenta.",
      };
    }
  }

  getAgents(): HadesAgent[] {
    return [...this.agents];
  }
}
