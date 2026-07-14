export interface MemoryRecord {
  text: string;
  type: "personal" | "business" | "project" | "knowledge";
  importance: number;
  source: string;
  tags: string[];
 
 createdAt: string;
}
