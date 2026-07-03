export class HadesCommander {

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

    public status(): void {
        console.log("Commander status: READY");
    }
}
