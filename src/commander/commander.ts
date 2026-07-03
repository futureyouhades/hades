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

public analyze(command: string): void {

    if (command.includes("otwórz")) {
        console.log("Action: OPEN");
    } else if (command.includes("szukaj")) {
        console.log("Action: SEARCH");
    } else {
        console.log("Action: UNKNOWN");
    }

}

    if (command.includes("otwórz")) {
        console.log("Action: OPEN");
    }

    else if (command.includes("szukaj")) {
        console.log("Action: SEARCH");
    }

    else if (command.includes("zapamiętaj")) {
        console.log("Action: MEMORY");
    }

    else {
        console.log("Action: UNKNOWN");
    }

}
}
