import { HadesRouter } from "../router";

export class HadesCommander {

    private router = new HadesRouter();

    constructor() {}

    public start(): void {
        console.log("Hades Commander started.");
    }

    public stop(): void {
        console.log("Hades Commander stopped.");
    }

    public execute(command: string): void {
        console.log(`Received command: ${command}`);
    }

    public analyze(command: string): void {

        if (command.includes("otwórz")) {
            this.router.route("OPEN");
        }
        else if (command.includes("szukaj")) {
            this.router.route("SEARCH");
        }
        else if (command.includes("pamięć")) {
            this.router.route("MEMORY");
        }
        else {
            this.router.route("UNKNOWN");
        }

    }

    public status(): void {
        console.log("Commander status: READY");
    }

}
