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
    const post = await this.generate(task.input);

    return {
      success: true,
      agent: this.name,
      output: post,
    };
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
`;

    const answer = await askModel(prompt);

    return JSON.parse(answer) as SocialPost;
  }
}
