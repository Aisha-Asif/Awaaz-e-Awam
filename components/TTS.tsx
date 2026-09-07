"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, Square } from "lucide-react";

interface UseTTSOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

function pickUrduVoice(voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | undefined {
  const urdu = voices.filter(v => v.lang.replace("_", "-").toLowerCase().startsWith("ur"));
  if (urdu.length > 0) return urdu[0];
  // fall back to lining up with the requested lang, then any Hindi voice
  const exact = voices.find(v => v.lang.replace("_", "-").toLowerCase() === lang.toLowerCase());
  if (exact) return exact;
  return voices.find(v => v.lang.toLowerCase().startsWith("hi"));
}

export function useTTS(options: UseTTSOptions = {}) {
  const { lang = "ur-PK", rate = 0.9, pitch = 1, volume = 1 } = options;
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const [voiceUnavailable, setVoiceUnavailable] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | undefined>(undefined);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    setSupported(true);

    const refresh = () => {
      const voices = window.speechSynthesis.getVoices();
      voiceRef.current = pickUrduVoice(voices, lang);
      // ponytail: many devices ship no Urdu voice; surface it rather than
      // silently reading with a wrong/default voice.
      setVoiceUnavailable(voices.length > 0 && !voiceRef.current);
    };

    refresh();
    window.speechSynthesis.addEventListener("voiceschanged", refresh);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", refresh);
  }, [lang]);

  const speak = useCallback((text: string) => {
    if (!supported) return;

    const utterance = new SpeechSynthesisUtterance(text);
    if (voiceRef.current) {
      utterance.voice = voiceRef.current;
      utterance.lang = voiceRef.current.lang;
    } else {
      utterance.lang = lang;
    }
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

  return { speak, stop, pause, resume, speaking, supported, voiceUnavailable };
}

interface TTSButtonProps {
  text: string;
  lang?: string;
  className?: string;
  disabled?: boolean;
}

export function TTSButton({ text, lang = "ur-PK", className = "", disabled = false }: TTSButtonProps) {
  const { speak, stop, speaking, supported, voiceUnavailable } = useTTS({ lang });

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
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-card text-xs font-semibold font-body transition-all duration-200 border
        ${speaking
          ? "bg-rani-light text-rani border-rani/30 hover:bg-rani/20 animate-pulse"
          : "bg-paper-card text-text-muted border-line hover:border-line-strong hover:text-text hover:bg-paper-subtle"}
        disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      aria-label={speaking ? "Stop reading" : "Read aloud"}
      aria-pressed={speaking}
      title={voiceUnavailable ? "No Urdu voice available on this device; using best available" : undefined}
    >
      {speaking ? (
        <Square className="w-3.5 h-3.5 fill-current" />
      ) : (
        <Volume2 className="w-3.5 h-3.5 text-jade" />
      )}
      <span>{speaking ? "Stop" : "Listen"}</span>
    </button>
  );
}
