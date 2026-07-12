import { askModel } from "../ai/model-router.js";

export interface SocialPost {
  title: string;
  post: string;
  hashtags: string[];
  cta: string;
  imagePrompt: string;
}

export class SocialAgent {
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
