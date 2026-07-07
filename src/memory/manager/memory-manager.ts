export interface MemoryDecision {
  save: boolean;
  importance: number;
}

export class MemoryManager {
  evaluate(text: string): MemoryDecision {

    if (text.length < 10) {
      return {
        save: false,
        importance: 1,
      };
    }

    return {
      save: true,
      importance: 7,
    };
  }
}
