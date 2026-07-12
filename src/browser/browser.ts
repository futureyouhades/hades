import type {
  AgentTask,
  AgentResult,
  HadesAgent,
} from "../agents/core/index.js";

export interface BrowserResult {
  url: string;
  title: string;
  content: string;
}

export class HadesBrowser implements HadesAgent {
  readonly name = "browser";

  readonly description = "Browser Agent";

  canHandle(task: AgentTask): boolean {
    return task.type === "browser";
  }

  async execute(task: AgentTask): Promise<AgentResult> {
    const result = await this.open(task.input);

    return {
      success: true,
      agent: this.name,
      output: result,
    };
  }

  public async open(url: string): Promise<BrowserResult> {
    console.log(`🌐 Opening: ${url}`);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "HADES-AI/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Cannot open ${url}`);
    }

    const html = await response.text();

    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);

    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return {
      url,
      title: titleMatch?.[1]?.trim() ?? "No title",
      content: text.substring(0, 8000),
    };
  }

  public summarize(result: BrowserResult): string {
    return `
URL: ${result.url}

TITLE:
${result.title}

CONTENT:
${result.content}
`;
  }
}
