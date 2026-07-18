interface HadesSpeechAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface HadesSpeechResult {
  readonly isFinal: boolean;
  readonly length: number;
  readonly [index: number]: HadesSpeechAlternative;
}

interface HadesSpeechResultList {
  readonly length: number;
  readonly [index: number]: HadesSpeechResult;
}

interface HadesSpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: HadesSpeechResultList;
}

interface HadesSpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface HadesSpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: HadesSpeechRecognitionEvent) => void) | null;
  onerror: ((event: HadesSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface HadesSpeechRecognitionConstructor {
  new (): HadesSpeechRecognition;
}

interface Window {
  SpeechRecognition?: HadesSpeechRecognitionConstructor;
  webkitSpeechRecognition?: HadesSpeechRecognitionConstructor;
}
