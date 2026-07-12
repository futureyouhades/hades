import { askHades } from "../hades/brain.js";
import { HadesPlanner } from "../planner/index.js";

export class HadesCommander {
  private readonly planner = new HadesPlanner();

  async execute(input: string): Promise<string> {
    const command = input.toLowerCase();

    if (
      command.includes("jak masz na imię") ||
      command.includes("kim jesteś")
    ) {
      this.planner.plan(input);

      return await askHades("Przedstaw się jako Hades.");
    }

    const plan = this.planner.plan(input);

    if (plan.useSearch) {
      console.log("[Planner] Search required");
    }

    if (plan.useTools) {
      console.log("[Planner] Tools required");
    }

    if (plan.useAgent) {
      console.log(`[Planner] Agent: ${plan.selectedAgent}`);
    }

    return await askHades(input);
  }
}
