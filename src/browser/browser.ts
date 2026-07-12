export interface BrowserResult {
  url: string;
  title: string;
  content: string;
}

export class HadesBrowser {
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
