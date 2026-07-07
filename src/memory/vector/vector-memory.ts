import { randomUUID } from "crypto";
import { qdrant } from "../../infrastructure/qdrant/client";
import { EmbeddingService } from "../../embeddings/embedding";
import type { MemoryRecord } from "../types";

export class VectorMemory {
  private embedding = new EmbeddingService();

  async remember(memory: MemoryRecord) {
    console.log(`Saving memory: ${memory.text}`);

    const vector = await this.embedding.embed(memory.text);

    await qdrant.upsert("hades_memory", {
      wait: true,
      points: [
        {
          id: randomUUID(),
          vector,
          payload: memory,
        },
      ],
    });

    console.log("Memory saved.");
  }

  async search(query: string, limit = 5) {
    const vector = await this.embedding.embed(query);

    const results = await qdrant.search("hades_memory", {
      vector,
      limit,
      with_payload: true,
    });

    return results.map((item: any) => ({
      score: item.score,
      memory: item.payload,
    }));
  }
}
