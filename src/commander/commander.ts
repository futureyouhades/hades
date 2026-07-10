import { askHades } from "../hades/brain.js";

export class HadesCommander {
  async execute(input: string): Promise<string> {

    const command = input.toLowerCase();

    if (
      command.includes("jak masz na imię") ||
      command.includes("kim jesteś")
    ) {
      return await askHades("Przedstaw się jako Hades.");
    }

    return await askHades(input);
  }
}
