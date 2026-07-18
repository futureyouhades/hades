export type VoiceState = "idle" | "listening" | "thinking" | "speaking" | "error";

export interface ChatMessage {
  id: string;
  role: "user" | "hades";
  name: string;
  text: string;
  time: string;
}
