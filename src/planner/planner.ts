export interface PlannerResult {
  useMemory: boolean;
  useAgent: boolean;
  useTools: boolean;
  useSearch: boolean;
  selectedAgent?: string;
  selectedModel?: string;
}

export class HadesPlanner {
  plan(task: string): PlannerResult {

    const text = task.toLowerCase();

    const result: PlannerResult = {
      useMemory: true,
      useAgent: false,
      useTools: false,
      useSearch: false,
      selectedModel: "claude"
    };

    if (
      text.includes("napisz") ||
      text.includes("kod") ||
      text.includes("typescript") ||
      text.includes("python")
    ) {
      result.useAgent = true;
      result.selectedAgent = "programmer";
    }

    if (
      text.includes("wyszukaj") ||
      text.includes("internet") ||
      text.includes("google")
    ) {
      result.useSearch = true;
    }

    if (
      text.includes("otwórz") ||
      text.includes("uruchom")
    ) {
      result.useTools = true;
    }

    return result;
  }
}
