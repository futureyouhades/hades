import { tavily } from "@tavily/core";

export interface SearchResult {
  title: string;
  url: string;
  content: string;
}

const client = tavily({
  apiKey: process.env.TAVILY_API_KEY!,
});

export class HadesSearch {
  async search(query: string): Promise<SearchResult[]> {
    console.log(`[Search] ${query}`);

    const response = await client.search(query, {
      searchDepth: "advanced",
      maxResults: 5,
      includeAnswer: false,
      includeRawContent: false,
    });

    return response.results.map((result) => ({
      title: result.title,
      url: result.url,
      content: result.content ?? "",
    }));
  }
}
