import { qdrant } from "./client";

async function createCollection() {
  const collections = await qdrant.getCollections();

  const exists = collections.collections.some(
    (c) => c.name === "hades_memory"
  );

  if (exists) {
    console.log("Collection already exists.");
    return;
  }

  await qdrant.createCollection("hades_memory", {
    vectors: {
      size: 384,
      distance: "Cosine",
    },
  });

  console.log("Collection created.");
}

createCollection().catch(console.error);
