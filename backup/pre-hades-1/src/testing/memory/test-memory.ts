import { MemoryManager } from "../../memory/memory-manager.js";

async function main() {
  const memory = new MemoryManager();

  console.log("=== TEST PAMIĘCI HADES ===");

  await memory.remember({
    text: "Michał pracuje w UK.",
    type: "personal",
    importance: 10,
    source: "conversation",
    tags: ["uk", "work"],
    createdAt: new Date().toISOString(),
  });

  await memory.remember({
    text: "Hades jest osobistym asystentem AI.",
    type: "project",
    importance: 10,
    source: "system",
    tags: ["hades", "ai"],
    createdAt: new Date().toISOString(),
  });

  await memory.remember({
    text: "Qdrant przechowuje pamięć wektorową.",
    type: "knowledge",
    importance: 7,
    source: "system",
    tags: ["qdrant", "memory"],
    createdAt: new Date().toISOString(),
  });

  await memory.remember({
    text: "Dzisiaj świeci słońce.",
    type: "knowledge",
    importance: 2,
    source: "conversation",
    tags: ["weather"],
    createdAt: new Date().toISOString(),
  });

  console.log("\n=== WYSZUKIWANIE ===");

  const results = await memory.search("Gdzie pracuje Michał?");

  console.dir(results, { depth: null });
}

main().catch(console.error);
