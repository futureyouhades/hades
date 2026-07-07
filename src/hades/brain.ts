import { askClaude } from "../ai/claude";
import { VectorMemory } from "../memory/vector/vector-memory";
import { MemoryManager } from "../memory/manager/memory-manager";

const memory = new VectorMemory();
const manager = new MemoryManager();

export async function askHades(question: string) {

  const decision = await manager.evaluate(question);

  if (decision.save) {
    await memory.remember({
      text: question,
      type: "conversation",
      importance: decision.importance,
      source: "user",
      tags: ["conversation"],
    });
  }

  const memories = await memory.search(question);

  const context = memories
    .map((m: any) => `- ${m.memory.text}`)
    .join("\n");

  const prompt = `
Jesteś Hades.

Zapamiętane informacje:

${context}

Pytanie użytkownika:

${question}
`;

  const answer = await askClaude(prompt);

  await memory.remember({
    text: answer,
    type: "conversation",
    importance: 7,
    source: "assistant",
    tags: ["conversation"],
  });

  return answer;
}
