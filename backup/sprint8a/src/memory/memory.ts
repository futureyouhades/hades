export class HadesMemory {

    private memories: string[] = [];

    public remember(text: string): void {
        this.memories.push(text);
        console.log(`🧠 Remembered: ${text}`);
    }

    public recall(): void {

        console.log("===== MEMORY =====");

        for (const memory of this.memories) {
            console.log(memory);
        }

    }

}
