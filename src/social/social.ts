import { askModel } from "../ai/model-router.js";
import type {
  AgentTask,
  AgentResult,
  HadesAgent,
} from "../agents/core/index.js";

export interface SocialPost {
  title: string;
  post: string;
  hashtags: string[];
  cta: string;
  imagePrompt: string;
}

export class SocialAgent implements HadesAgent {
  readonly name = "social";

  readonly description = "Social Media Agent";

  canHandle(task: AgentTask): boolean {
    return task.type === "social";
  }

  async execute(task: AgentTask): Promise<AgentResult> {
    try {
      const post = await this.generate(task.input);

      return {
        success: true,
        agent: this.name,
        output: post,
      };
    } catch (error) {
      return {
        success: false,
        agent: this.name,
        output: null,
        error:
          error instanceof Error
            ? error.message
            : "Nie udało się wygenerować posta.",
      };
    }
  }

  async generate(topic: string): Promise<SocialPost> {
    const prompt = `
Jesteś ekspertem od marketingu.

Na podstawie tematu:

${topic}

Przygotuj odpowiedź WYŁĄCZNIE w JSON:

{
  "title":"",
  "post":"",
  "hashtags":["","",""],
  "cta":"",
  "imagePrompt":""
}

Zwróć wyłącznie surowy JSON w powyższym formacie.
Bez komentarzy, bez bloków kodu (\`\`\`), bez tekstu przed ani po.
Pole "post" nie może być puste.
`;

    const answer = await askModel(prompt);

    return this.parsePost(answer);
  }

  private parsePost(answer: string): SocialPost {
    // Modele często opakowują JSON w blok ```json ... ``` lub dodają tekst.
    const withoutFence = answer
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const start = withoutFence.indexOf("{");
    const end = withoutFence.lastIndexOf("}");

    const candidate =
      start !== -1 && end !== -1 && end > start
        ? withoutFence.slice(start, end + 1)
        : withoutFence;

    try {
      return JSON.parse(candidate) as SocialPost;
    } catch {
      throw new Error(
        "Model nie zwrócił poprawnego JSON dla posta social media."
      );
    }
  }
}
