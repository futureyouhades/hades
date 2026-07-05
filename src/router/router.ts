import { HadesBrowser } from "../browser";

export class HadesRouter {

    private browser = new HadesBrowser();

    public route(action: string): void {

        switch (action) {

            case "OPEN":
                this.browser.open("google.com");
                break;

            case "SEARCH":
                console.log("🔍 Routing to Search module");
                break;

            case "MEMORY":
                console.log("🧠 Routing to Memory module");
                break;

            default:
                console.log("❓ Unknown action");
        }

    }

}
