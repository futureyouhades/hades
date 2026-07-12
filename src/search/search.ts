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

const client = tavily({
  apiKey: process.env.TAVILY_API_KEY!,
});

export class HadesSearch implements HadesAgent {
  readonly name = "search";

  readonly description = "Internet search using Tavily";

  canHandle(task: AgentTask): boolean {
    return task.type === "search";
  }

  async execute(task: AgentTask): Promise<AgentResult> {
    const response = await client.search(task.input, {
      searchDepth: "advanced",
      maxResults: 5,
      includeAnswer: false,
      includeRawContent: false,
    });

    const results: SearchResult[] = response.results.map((result) => ({
      title: result.title,
      url: result.url,
      content: result.content ?? "",
    }));

    return {
      success: true,
      agent: this.name,
      output: results,
    };
  }

  async search(query: string): Promise<SearchResult[]> {
    const result = await this.execute({
      id: crypto.randomUUID(),
      type: "search",
      input: query,
    });

    return result.output as SearchResult[];
  }
}
