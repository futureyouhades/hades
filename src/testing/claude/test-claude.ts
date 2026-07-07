import { askClaude } from "../../ai/claude";

async function main() {
  console.log("=== TEST CLAUDE ===");

  const response = await askClaude(
    "Powiedz jedno zdanie po polsku i napisz, że Hades działa poprawnie."
  );

  console.log(response);
}

main().catch(console.error);
