import { tavily } from "@tavily/core";
import type {
  AgentTask,
  AgentResult,
  HadesAgent,
} from "../agents/core/index.js";

export interface SearchResult {
  title: string;
  url: string;
  content: string;
}

const SEARCH_DEPTH = "advanced" as const;
const MAX_RESULTS = 15;
const TOPIC = "general" as const;

export class HadesSearch implements HadesAgent {
  readonly name = "search";

  readonly description = "Internet search using Tavily";

  private client: ReturnType<typeof tavily> | null = null;

  private getClient(): ReturnType<typeof tavily> {
    const apiKey = process.env.TAVILY_API_KEY;

    if (!apiKey) {
      throw new Error(
        "Brak klucza TAVILY_API_KEY — wyszukiwanie internetowe jest niedostępne."
      );
    }

    if (!this.client) {
      this.client = tavily({ apiKey });
    }

    return this.client;
  }

  canHandle(task: AgentTask): boolean {
    return task.type === "search";
  }

  async execute(task: AgentTask): Promise<AgentResult> {
    try {
      const client = this.getClient();

      const response = await client.search(task.input, {
        searchDepth: SEARCH_DEPTH,
        maxResults: MAX_RESULTS,
        includeAnswer: true,
        topic: TOPIC,
      });

      const results: SearchResult[] = (response.results ?? [])
        .filter((result) => result.content)
        .map((result) => ({
          title: result.title,
          url: result.url,
          content: result.content ?? "",
        }));

      return {
        success: true,
        agent: this.name,
        output: results,
      };
    } catch (error) {
      return {
        success: false,
        agent: this.name,
        output: null,
        error:
          error instanceof Error
            ? error.message
            : "Błąd wyszukiwania internetowego.",
      };
    }
  }

  async search(query: string): Promise<SearchResult[]> {
    const result = await this.execute({
      id: crypto.randomUUID(),
      type: "search",
      input: query,
    });

    return result.success ? (result.output as SearchResult[]) : [];
  }
}
