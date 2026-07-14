import { askHades } from "../../hades/brain.js";

async function main() {
  console.log(await askHades("Jak masz na imię?"));
}

main().catch(console.error);
