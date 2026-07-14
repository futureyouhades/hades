import { VectorMemory } from "./vector/vector-memory.js";
import type { MemoryRecord } from "./types.js";

export interface MemoryDecision {
  save: boolean;
  importance: number;
}

export class MemoryManager {
  private memory = new VectorMemory();

  evaluate(text: string): MemoryDecision {
    if (text.length < 10) {
      return {
        save: false,
        importance: 1,
      };
    }

    return {
      save: true,
      importance: 7,
    };
  }

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