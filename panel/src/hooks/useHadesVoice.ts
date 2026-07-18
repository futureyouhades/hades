import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage, VoiceState } from "../types/voice";

const API_URL = import.meta.env.VITE_HADES_API_URL ?? "/api/chat";

const initialMessages: ChatMessage[] = [
  { id: "welcome-user", role: "user", name: "Michał", text: "Hej Hades", time: "05:52" },
  { id: "welcome-hades", role: "hades", name: "HADES", text: "Dzień dobry Michał. W czym mogę pomóc?", time: "05:53" },
];

function currentTime() {
  return new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit" }).format(new Date());
}

function messageId(role: string) {
  return `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function useHadesVoice() {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

  const stateRef = useRef<VoiceState>("idle");
  const recognitionRef = useRef<HadesSpeechRecognition | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const meterFrameRef = useRef<number | null>(null);
  const speechTimerRef = useRef<number | null>(null);
  const autoListenRef = useRef(false);
  const startListeningRef = useRef<() => void>(() => undefined);

  const transition = useCallback((next: VoiceState) => {
    stateRef.current = next;
    setVoiceState(next);
  }, []);

  const stopMeter = useCallback(() => {
    if (meterFrameRef.current !== null) cancelAnimationFrame(meterFrameRef.current);
    meterFrameRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (audioContextRef.current) void audioContextRef.current.close();
    audioContextRef.current = null;
    setVoiceLevel(0);
  }, []);

  const startMeter = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("Ta przeglądarka nie udostępnia mikrofonu.");

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    const context = new AudioContext();
    const analyser = context.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.72;
    context.createMediaStreamSource(stream).connect(analyser);

    const samples = new Uint8Array(analyser.frequencyBinCount);
    streamRef.current = stream;
    audioContextRef.current = context;

    const readLevel = () => {
      analyser.getByteFrequencyData(samples);
      let total = 0;
      for (const sample of samples) total += sample;
      const average = total / samples.length;
      setVoiceLevel(Math.min(1, average / 72));
      meterFrameRef.current = requestAnimationFrame(readLevel);
    };
    readLevel();
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    if (speechTimerRef.current !== null) window.clearInterval(speechTimerRef.current);
    speechTimerRef.current = null;
    setVoiceLevel(0);
    if (stateRef.current === "speaking") transition("idle");
  }, [transition]);

  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) {
      transition("idle");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pl-PL";
    utterance.rate = 0.88;
    utterance.pitch = 0.72;

    const voices = window.speechSynthesis.getVoices();
    const maleNames = ["marek", "jacek", "adam", "piotr", "male"];
    const polishVoice = voices.find((voice) => {
      const name = voice.name.toLowerCase();
      return voice.lang.toLowerCase().startsWith("pl") && maleNames.some((candidate) => name.includes(candidate));
    }) ?? voices.find((voice) => voice.lang.toLowerCase().startsWith("pl"));
    if (polishVoice) utterance.voice = polishVoice;

    utterance.onstart = () => {
      transition("speaking");
      speechTimerRef.current = window.setInterval(() => {
        setVoiceLevel(0.28 + Math.random() * 0.68);
      }, 95);
    };
    utterance.onboundary = () => setVoiceLevel(0.92);
    utterance.onerror = () => {
      if (speechTimerRef.current !== null) window.clearInterval(speechTimerRef.current);
      speechTimerRef.current = null;
      setVoiceLevel(0);
      transition("error");
      setError("Nie udało się odtworzyć głosu HADES-a.");
    };
    utterance.onend = () => {
      if (speechTimerRef.current !== null) window.clearInterval(speechTimerRef.current);
      speechTimerRef.current = null;
      setVoiceLevel(0);
      if (autoListenRef.current) {
        transition("idle");
        window.setTimeout(() => startListeningRef.current(), 420);
      } else {
        transition("idle");
      }
    };

    window.speechSynthesis.speak(utterance);
  }, [transition]);

  const sendMessage = useCallback(async (rawText: string) => {
    const text = rawText.trim();
    if (!text || stateRef.current === "thinking") return;

    recognitionRef.current?.stop();
    stopMeter();
    stopSpeaking();
    setTranscript("");
    setError(null);
    setMessages((current) => [...current, {
      id: messageId("user"), role: "user", name: "Michał", text, time: currentTime(),
    }]);
    transition("thinking");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const payload = await response.json() as { success?: boolean; answer?: string };
      if (!response.ok || !payload.success || !payload.answer) throw new Error("HADES API nie zwróciło odpowiedzi.");

      setMessages((current) => [...current, {
        id: messageId("hades"), role: "hades", name: "HADES", text: payload.answer!, time: currentTime(),
      }]);
      speak(payload.answer);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Nieznany błąd połączenia.";
      setError(message);
      setMessages((current) => [...current, {
        id: messageId("error"), role: "hades", name: "HADES", text: `Nie mogę teraz odpowiedzieć. ${message}`, time: currentTime(),
      }]);
      transition("error");
    }
  }, [speak, stopMeter, stopSpeaking, transition]);

  const startListening = useCallback(async () => {
    setError(null);
    setTranscript("");

    if (!window.isSecureContext && window.location.hostname !== "localhost") {
      setError("Mikrofon wymaga bezpiecznego adresu HTTPS.");
      transition("error");
      return;
    }

    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) {
      setError("Rozpoznawanie mowy nie jest dostępne. Użyj przeglądarki Chrome.");
      transition("error");
      return;
    }

    try {
      stopSpeaking();
      await startMeter();
      const recognition = new Recognition();
      recognition.lang = "pl-PL";
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognitionRef.current = recognition;

      recognition.onstart = () => transition("listening");
      recognition.onresult = (event) => {
        let interim = "";
        let finalText = "";
        for (let index = event.resultIndex; index < event.results.length; index++) {
          const result = event.results[index];
          if (result.isFinal) finalText += result[0].transcript;
          else interim += result[0].transcript;
        }
        setTranscript(finalText || interim);
        if (finalText.trim()) void sendMessage(finalText);
      };
      recognition.onerror = (event) => {
        stopMeter();
        if (event.error === "no-speech" && autoListenRef.current) {
          transition("idle");
          window.setTimeout(() => startListeningRef.current(), 350);
          return;
        }
        const denied = event.error === "not-allowed" || event.error === "service-not-allowed";
        autoListenRef.current = false;
        setError(denied ? "Zezwól przeglądarce na dostęp do mikrofonu." : `Błąd mikrofonu: ${event.error}.`);
        transition("error");
      };
      recognition.onend = () => {
        stopMeter();
        if (stateRef.current === "listening") {
          transition("idle");
          if (autoListenRef.current) window.setTimeout(() => startListeningRef.current(), 350);
        }
      };
      recognition.start();
    } catch (microphoneError) {
      stopMeter();
      const message = microphoneError instanceof Error ? microphoneError.message : "Nie udało się uruchomić mikrofonu.";
      setError(message);
      autoListenRef.current = false;
      transition("error");
    }
  }, [sendMessage, startMeter, stopMeter, stopSpeaking, transition]);

  startListeningRef.current = () => void startListening();

  const toggleListening = useCallback(() => {
    if (autoListenRef.current) {
      autoListenRef.current = false;
      recognitionRef.current?.stop();
      stopMeter();
      stopSpeaking();
      transition("idle");
      return;
    }
    autoListenRef.current = true;
    void startListening();
  }, [startListening, stopMeter, stopSpeaking, transition]);

  useEffect(() => () => {
    autoListenRef.current = false;
    recognitionRef.current?.abort();
    stopMeter();
    window.speechSynthesis?.cancel();
    if (speechTimerRef.current !== null) window.clearInterval(speechTimerRef.current);
  }, [stopMeter]);

  return {
    voiceState,
    voiceLevel,
    transcript,
    error,
    messages,
    sendMessage,
    toggleListening,
    stopSpeaking,
  };
}
