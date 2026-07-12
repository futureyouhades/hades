export interface PlannerResult {
  useMemory: boolean;

  useSearch: boolean;
  useBrowser: boolean;
  useSocial: boolean;
  useEmail: boolean;
  useTools: boolean;

  selectedAgent?: string;
  selectedModel?: string;
}
