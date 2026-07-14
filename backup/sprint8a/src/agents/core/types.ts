export interface AgentTask {
  id: string;
  type: string;
  input: string;
  context?: Record<string, unknown>;
}

export interface AgentResult {
  success: boolean;
  agent: string;
  output: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
}
