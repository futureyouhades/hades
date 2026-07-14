import { askModel } from "../ai/model-router.js";
import { HADES_IDENTITY } from "./identity.js";
import { VectorMemory } from "../memory/vector/vector-memory.js";
import { MemoryManager } from "../memory/memory-manager.js";

const memory = new VectorMemory();
const manager = new MemoryManager();

const conversation: {
  role: "user" | "assistant";
  content: string;
}[] = [];

function buildConversation(): string {
  return conversation
    .slice(-12)
    .map((m) =>
      m.role === "user"
        ? `Użytkownik: ${m.content}`
        : `Hades: ${m.content}`
    )
    .join("\n");
}

export async function askHades(question: string): Promise<string> {
  conversation.push({
    role: "user",
    content: question,
  });

  const decision = manager.evaluate(question);

  if (decision.save) {
    await memory.remember({
      text: question,
      type: "knowledge",
      importance: decision.importance,
      source: "user",
      tags: ["conversation"],
      createdAt: new Date().toISOString(),
    });
  }

  const memories = await memory.search(question);

  const context = memories
    .map((m: any) => `- ${m.memory.text}`)
    .join("\n");

  const history = buildConversation();

  const prompt = `
${HADES_IDENTITY}

Zapamiętane informacje:

${context || "Brak."}

Historia rozmowy:

${history}

Aktualne pytanie użytkownika:

${question}

Odpowiadaj naturalnie, uwzględniając historię rozmowy.
`;

  const answer = await askModel(prompt);

  conversation.push({
    role: "assistant",
    content: answer,
  });

  await memory.remember({
    text: answer,
    type: "knowledge",
    importance: 7,
    source: "assistant",
    tags: ["conversation"],
    createdAt: new Date().toISOString(),
  });

  return answer;
}
