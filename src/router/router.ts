import { HadesBrowser } from "../browser";
import { HadesMemory } from "../memory";

export class HadesRouter {

    private browser = new HadesBrowser();
    private memory = new HadesMemory();

    public route(action: string): void {

        switch (action) {

            case "OPEN":
                this.browser.open("https://google.com");
                break;

            case "SEARCH":
                this.browser.search("Hades AI");
                break;

            case "MEMORY_SAVE":
                this.memory.remember("Pierwsza pamięć Hadesa");
                break;

            case "MEMORY_READ":
                this.memory.recall();
                break;

            default:
                console.log("Unknown action");
        }

    }

}
