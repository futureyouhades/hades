import { askClaude } from "./claude.js";
import { askQwen } from "./qwen.js";

export async function askModel(prompt: string): Promise<string> {
  const text = prompt.toLowerCase();

  try {
    if (
      text.includes("kod") ||
      text.includes("typescript") ||
      text.includes("javascript") ||
      text.includes("python") ||
      text.includes("program")
    ) {
      return await askQwen(prompt);
    }

    return await askClaude(prompt);
  } catch {
    return await askClaude(prompt);
  }
}
