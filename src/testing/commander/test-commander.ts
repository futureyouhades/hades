import { HadesCommander } from "../../commander/commander.js";

async function main() {

  const commander = new HadesCommander();

  console.log(await commander.execute("Jak masz na imię?"));

  console.log("----------------");

  console.log(await commander.execute("Kim jesteś?"));

}

main().catch(console.error);
