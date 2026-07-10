import type { HadesAgent } from "./agent.js";

export class AgentManager {
  private readonly agents: HadesAgent[] = [];

  register(agent: HadesAgent): void {
    this.agents.push(agent);
  }

  findAgent(task: string): HadesAgent | undefined {
    return this.agents.find((agent) => agent.canHandle(task));
  }

  async execute(task: string): Promise<string> {
    const agent = this.findAgent(task);

    if (!agent) {
      return "Nie znalazłem odpowiedniego agenta do wykonania tego zadania.";
    }

    return agent.execute(task);
  }

  getAgents(): HadesAgent[] {
    return [...this.agents];
  }
}
