import { pipeline } from "@xenova/transformers";

export class EmbeddingService {
  private extractor: any = null;

  async init() {
    if (!this.extractor) {
      this.extractor = await pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2"
      );
    }
  }

  async embed(text: string): Promise<number[]> {
    await this.init();

    const output = await this.extractor(text, {
      pooling: "mean",
      normalize: true,
    });

    return Array.from(output.data);
  }
}
