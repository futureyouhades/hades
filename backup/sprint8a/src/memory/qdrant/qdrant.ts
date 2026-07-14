export class QdrantMemory {
  public connect(): void {
    console.log("Connected to Qdrant");
  }

  public save(key: string, value: string): void {
    console.log(`Saving '${key}' to Qdrant`);
  }

  public load(key: string): string {
    console.log(`Loading '${key}' from Qdrant`);
    return "";
  }
}
