import { randomUUID } from "crypto";
import { qdrant } from "../../infrastructure/qdrant/client.js";
import { EmbeddingService } from "../../embeddings/embedding.js";
import type { MemoryRecord } from "../types.js";

export class VectorMemory {
  private embedding = new EmbeddingService();

  async remember(memory: MemoryRecord) {
    try {
      const vector = await this.embedding.embed(memory.text);

      await qdrant.upsert("hades_memory", {
        wait: true,
        points: [
          {
            id: randomUUID(),
            vector,
            payload: memory as unknown as Record<string, unknown>,
          },
        ],
      });
    } catch (error) {
      console.error("[VectorMemory] remember failed:", error);
    }
  }

  async search(query: string, limit = 5) {
    try {
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
    } catch (error) {
      console.error("[VectorMemory] search failed:", error);
      return [];
    }
  }
}
