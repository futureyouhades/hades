import { askClaude } from "../ai/claude.js";
import { HADES_IDENTITY } from "./identity.js";
import { VectorMemory } from "../memory/vector/vector-memory.js";
import { MemoryManager } from "../memory/memory-manager.js";

const memory = new VectorMemory();
const manager = new MemoryManager();

export async function askHades(question: string) {
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

  const prompt = `
${HADES_IDENTITY}

Zapamiętane informacje:

${context}

Pytanie użytkownika:

${question}
`;

  const answer = await askClaude(prompt);

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
