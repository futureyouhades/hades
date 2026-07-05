import { qdrant } from "../../infrastructure/qdrant/client";

export class VectorMemory {
  async remember(text: string) {
    console.log(`Saving memory: ${text}`);

    // Na razie tylko sprawdzamy połączenie.
    await qdrant.getCollections();

    console.log("Memory connection OK");
  }
}
