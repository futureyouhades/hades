import { pipeline } from "@xenova/transformers";

async function main() {
  console.log("Loading model...");

  const extractor = await pipeline(
    "feature-extraction",
    "Xenova/all-MiniLM-L6-v2"
  );

  console.log("Model loaded.");

  const output = await extractor("Hello Hades!", {
    pooling: "mean",
    normalize: true,
  });

  console.log(output.data.slice(0, 10));
}

main();
