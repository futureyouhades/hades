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
      console.log("[ModelRouter] Qwen");
      return await askQwen(prompt);
    }

    console.log("[ModelRouter] Claude");
    return await askClaude(prompt);

  } catch (error) {
    console.log("[ModelRouter] Fallback -> Claude");
    return await askClaude(prompt);
  }
}
