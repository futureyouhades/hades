import readline from "node:readline";
import { HadesCommander } from "./commander/index.js";

const commander = new HadesCommander();

console.clear();

console.log(`
═══════════════════════════════════════
              HADES AI
═══════════════════════════════════════

Status: ONLINE

Wpisz 'exit' aby zakończyć.

`);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(): void {
  rl.question("HADES > ", async (input) => {
    if (input.trim().toLowerCase() === "exit") {
      console.log("\nDo zobaczenia.\n");
      rl.close();
      process.exit(0);
    }

    try {
      const response = await commander.execute(input);

      console.log("\n" + response + "\n");
    } catch (err) {
      console.error(err);
    }

    prompt();
  });
}

prompt();
