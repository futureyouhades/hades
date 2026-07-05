import { QdrantClient } from "@qdrant/js-client-rest";

export const qdrant = new QdrantClient({
  url: "http://localhost:6333",
});

export async function checkQdrant() {
  const collections = await qdrant.getCollections();

  console.log("Qdrant connected.");
  console.log(collections);
}
