"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Browser Web Speech API fast-path: transcribe short Urdu answers on-device,
// bypassing the server /api/transcribe (Gemini) round-trip. Chrome/Edge/Android
// only; other browsers report supported=false and flows keep their server path.
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function useSpeechRecognition(lang = "ur-PK") {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const finalResultRef = useRef<string>("");
  const onResultRef = useRef<((text: string) => void) | null>(null);

  useEffect(() => {
    setSupported(getRecognitionCtor() !== null);
  }, []);

  const start = useCallback((onResult: (text: string) => void) => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    if (recRef.current) recRef.current.stop();

    onResultRef.current = onResult;
    const rec = new Ctor();
    rec.lang = lang;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (event) => {
      const first = event.results?.[0]?.[0]?.transcript;
      if (first) finalResultRef.current = first.trim();
    };
    rec.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setError("Microphone permission is needed for voice answers.");
      } else if (event.error !== "aborted" && event.error !== "no-speech") {
        setError("Could not recognize speech on this device. Please type instead.");
      }
    };
    rec.onend = () => {
      setListening(false);
      if (finalResultRef.current) {
        onResultRef.current?.(finalResultRef.current);
        finalResultRef.current = "";
      }
    };

    recRef.current = rec;
    setError(null);
    setListening(true);
    rec.start();
  }, [lang]);

  const stop = useCallback(() => {
    recRef.current?.stop();
  }, []);

  // ponytail: real on-device flows stop when the user taps; a hard cap keeps a
  // runaway session from holding the mic forever if onend never fires.
  useEffect(() => {
    if (!listening) return;
    const t = setTimeout(() => recRef.current?.stop(), 20000);
    return () => clearTimeout(t);
  }, [listening]);

  useEffect(() => () => recRef.current?.stop(), []);

  return { supported, listening, start, stop, error };
}