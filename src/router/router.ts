export class HadesRouter {

    public route(action: string): void {

        switch (action) {

            case "OPEN":
                console.log("➡ Routing to Browser module");
                break;

            case "SEARCH":
                console.log("➡ Routing to Search module");
                break;

            case "MEMORY":
                console.log("➡ Routing to Memory module");
                break;

            default:
                console.log("❓ Unknown action");
        }

    }

}
