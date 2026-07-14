import type { PlannerResult } from "./types.js";

export class HadesPlanner {
  plan(task: string): PlannerResult {
    const text = task.toLowerCase();

    return {
      useMemory: true,

      useSearch:
        text.includes("wyszukaj") ||
        text.includes("znajdź") ||
        text.includes("internet") ||
        text.includes("google"),

      useBrowser:
        text.includes("otwórz") ||
        text.includes("stronę") ||
        text.includes("website") ||
        text.includes("url"),

      useSocial:
        text.includes("post") ||
        text.includes("facebook") ||
        text.includes("instagram") ||
        text.includes("linkedin") ||
        text.includes("social"),

      useEmail:
        text.includes("mail") ||
        text.includes("email") ||
        text.includes("gmail") ||
        text.includes("wiadomość"),

      useTools:
        text.includes("uruchom") ||
        text.includes("otwórz aplikację"),

      selectedModel: "claude",
    };
  }
}
