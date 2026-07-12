import type { AgentTask, AgentResult } from "./types.js";

export interface HadesAgent {
  readonly name: string;
  readonly description: string;

  canHandle(task: AgentTask): boolean;

  execute(task: AgentTask): Promise<AgentResult>;
}
