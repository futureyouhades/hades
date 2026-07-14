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
      return await askHades("Przedstaw się jako Hades.");
    }

    const plan = this.planner.plan(input);

    if (plan.useSearch) {
      console.log("[Planner] Search");
    }

    if (plan.useBrowser) {
      console.log("[Planner] Browser");
    }

    if (plan.useSocial) {
      console.log("[Planner] Social");
    }

    if (plan.useEmail) {
      console.log("[Planner] Email");
    }

    if (plan.useTools) {
      console.log("[Planner] Tools");
    }

    return await askHades(input);
  }
}
