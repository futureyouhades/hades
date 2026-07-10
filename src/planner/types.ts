export interface PlannerResult {
  useMemory: boolean;
  useAgent: boolean;
  useTools: boolean;
  useSearch: boolean;

  selectedAgent?: string;
  selectedModel?: string;
}
