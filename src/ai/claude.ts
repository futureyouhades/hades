import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function askClaude(prompt: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  console.log("=== CLAUDE RESPONSE ===");
  console.log(JSON.stringify(response, null, 2));

  const content = response.content[0];

  if (content.type !== "text") {
    return "";
  }

  return content.text;
}
