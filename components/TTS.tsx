"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseTTSOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export function useTTS(options: UseTTSOptions = {}) {
  const { lang = "ur-PK", rate = 0.9, pitch = 1, volume = 1 } = options;
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setSupported(true);
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!supported) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [supported, lang, rate, pitch, volume]);

  const stop = useCallback(() => {
    if (supported) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }, [supported]);

  const pause = useCallback(() => {
    if (supported) {
      window.speechSynthesis.pause();
    }
  }, [supported]);

  const resume = useCallback(() => {
    if (supported) {
      window.speechSynthesis.resume();
    }
  }, [supported]);

  return { speak, stop, pause, resume, speaking, supported };
}

interface TTSButtonProps {
  text: string;
  lang?: string;
  className?: string;
  disabled?: boolean;
}

export function TTSButton({ text, lang = "ur-PK", className = "", disabled = false }: TTSButtonProps) {
  const { speak, stop, speaking, supported } = useTTS({ lang });

  if (!supported) return null;

  const handleClick = () => {
    if (speaking) {
      stop();
    } else {
      speak(text);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || !text.trim()}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-card text-sm font-medium font-body transition-colors
        ${speaking
          ? "bg-rani/10 text-rani hover:bg-rani/20"
          : "bg-line text-text-muted hover:bg-on-ink"}
        disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      aria-label={speaking ? "Stop reading" : "Read aloud"}
      aria-pressed={speaking}
    >
      {speaking ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
      )}
      <span>{speaking ? "Stop" : "Listen"}</span>
    </button>
  );
}
