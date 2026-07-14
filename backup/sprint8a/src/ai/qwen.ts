const OPENROUTER_API = "https://openrouter.ai/api/v1/chat/completions";

interface OpenRouterResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

export async function askQwen(prompt: string): Promise<string> {
  const response = await fetch(OPENROUTER_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "qwen/qwen3-coder",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter error: ${response.status}`);
  }

  const data = (await response.json()) as OpenRouterResponse;

  return data.choices?.[0]?.message?.content ?? "";
}
