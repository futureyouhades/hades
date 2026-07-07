import { VectorMemory } from "./vector/vector-memory";
import type { MemoryRecord } from "./types";

export class MemoryManager {
  private memory = new VectorMemory();

  async remember(memory: MemoryRecord) {
    if (memory.importance < 5) {
      console.log("Memory skipped (low importance).");
      return;
    }

    await this.memory.remember(memory);
  }

  async search(query: string, limit = 5) {
    return this.memory.search(query, limit);
  }
}
