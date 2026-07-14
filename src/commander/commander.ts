import { askHades } from "../hades/brain.js";
import { askModel } from "../ai/model-router.js";
import { HadesPlanner } from "../planner/index.js";
import { HadesOrchestrator } from "../orchestrator/index.js";
import type { BrowserResult } from "../browser/index.js";

interface SearchResult {
  title: string;
  url: string;
  content: string;
}

export class HadesCommander {
  private readonly planner = new HadesPlanner();
  private readonly orchestrator = new HadesOrchestrator();

  async execute(input: string): Promise<string> {
    const command = input.toLowerCase();

    if (
      command.includes("jak masz na imię") ||
      command.includes("kim jesteś")
    ) {
      return await askHades("Przedstaw się jako Hades.");
    }

    const plan = this.planner.plan(input);

    if (plan.useSearch) {
      const result = await this.orchestrator.execute({
        id: crypto.randomUUID(),
        type: "search",
        input,
      });

      if (result.success) {
        const sources = result.output as SearchResult[];

        const prompt = `
Jesteś Hades.

Użytkownik zapytał:

${input}

Poniżej znajdują się wyniki wyszukiwania z wielu źródeł.

Twoje zadanie:

- przeanalizuj wszystkie źródła,
- połącz informacje,
- odrzuć powtarzające się dane,
- jeżeli źródła sobie przeczą, zaznacz to,
- odpowiedz własnymi słowami,
- NIE cytuj JSON,
- NIE wypisuj surowych wyników.

Na końcu dodaj:

Źródła:

i wypisz wykorzystane strony.

Źródła:

${sources
  .map(
    (s) => `
TYTUŁ:
${s.title}

URL:
${s.url}

TREŚĆ:
${s.content}
`
  )
  .join("\n-------------------------\n")}
`;

        return await askModel(prompt);
      }
    }

    if (plan.useBrowser) {
      const url = this.extractUrl(input);

      if (url) {
        const result = await this.orchestrator.execute({
          id: crypto.randomUUID(),
          type: "browser",
          input: url,
        });

        if (result.success) {
          const page = result.output as BrowserResult;

          const prompt = `
Jesteś Hades.

Użytkownik poprosił o otwarcie i analizę strony internetowej.

Zapytanie użytkownika:

${input}

Zawartość pobranej strony:

URL:
${page.url}

TYTUŁ:
${page.title}

TREŚĆ:
${page.content}

Twoje zadanie:

- przeanalizuj treść strony,
- odpowiedz na potrzebę użytkownika własnymi słowami,
- jeżeli strona nie zawiera potrzebnych informacji, powiedz to wprost.
`;

          return await askModel(prompt);
        }
      }
    }

    if (plan.useSocial) {
      const result = await this.orchestrator.execute({
        id: crypto.randomUUID(),
        type: "social",
        input,
      });

      if (result.success) {
        return JSON.stringify(result.output, null, 2);
      }
    }

    if (plan.useEmail) {
      const result = await this.orchestrator.execute({
        id: crypto.randomUUID(),
        type: "email",
        input,
      });

      if (result.success) {
        return JSON.stringify(result.output, null, 2);
      }
    }

    return await askHades(input);
  }

  private extractUrl(input: string): string | null {
    const match = input.match(/https?:\/\/[^\s<>"']+/i);

    if (!match) {
      return null;
    }

    return match[0].replace(/[.,!?;:)\]}]+$/, "");
  }
}
