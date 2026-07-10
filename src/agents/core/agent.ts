export interface HadesAgent {
  id: string;
  name: string;
  description: string;

  canHandle(task: string): boolean;

  execute(task: string): Promise<string>;
}
