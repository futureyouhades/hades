import { HadesBrowser } from "../browser/browser.js";
import { MemoryManager } from "../memory/memory-manager.js";

export class HadesRouter {
  private browser = new HadesBrowser();
  private memory = new MemoryManager();

  public async route(action: string): Promise<void> {
    switch (action) {
      case "OPEN":
        this.browser.open("https://google.com");
        break;

      default:
        console.log("Unknown action");
    }
  }
}