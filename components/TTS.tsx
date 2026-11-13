"use client";

// TTS: text-to-speech via speechSynthesis. useTTS speaks text with the best voice for it (see lib/speech.ts: an Urdu voice
// for Urdu script, an English voice for Roman Urdu / English / numbers) and TTSButton is a Listen / Stop button that
// explains itself when this device cannot read the text aloud.
import { useCallback, useEffect, useState } from "react";
import { Volume2, Square } from "lucide-react";
import { chooseSpeech } from "@/lib/speech";

interface UseTTSOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
}

// speechSynthesis hook: speak/stop/pause/resume, plus the device's voices so callers can tell what can be read.
export function useTTS(options: UseTTSOptions = {}) {
  const { rate = 0.9, pitch = 1, volume = 1 } = options;
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    setSupported(true);

    // Voices often load after the page does, so listen for the list changing.
    const refresh = () => setVoices(window.speechSynthesis.getVoices());
    refresh();
    window.speechSynthesis.addEventListener("voiceschanged", refresh);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", refresh);
  }, []);

  // Says the text, using fallbackText (Roman Urdu or English) when the device has no voice for the original.
  // Returns false when nothing could be spoken.
  const speak = useCallback(
    (text: string, fallbackText?: string): boolean => {
      if (!supported) return false;

      const choice = chooseSpeech(text, fallbackText, window.speechSynthesis.getVoices());
      if (!choice) return false;

      const utterance = new SpeechSynthesisUtterance(choice.text);
      if (choice.voice) utterance.voice = choice.voice;
      utterance.lang = choice.lang;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);

      // Stop anything already speaking so answers do not overlap.
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      return true;
    },
    [supported, rate, pitch, volume],
  );

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

  return { speak, stop, pause, resume, speaking, supported, voices };
}

interface TTSButtonProps {
  text: string;
  // Roman Urdu or English version, read when the device cannot read the original (for example no Urdu voice).
  fallbackText?: string;
  className?: string;
  disabled?: boolean;
}

// Listen/Stop toggle; hidden where speechSynthesis is unsupported.
export function TTSButton({ text, fallbackText, className = "", disabled = false }: TTSButtonProps) {
  const { speak, stop, speaking, supported, voices } = useTTS();

  if (!supported) return null;

  const choice = chooseSpeech(text, fallbackText, voices);
  // Nothing to read, or this device cannot read it: say so instead of staying silent.
  const unreadable = !!text.trim() && choice === null;

  const handleClick = () => {
    if (speaking) {
      stop();
    } else {
      speak(text, fallbackText);
    }
  };

  const title = unreadable
    ? "This device has no Urdu voice, so this cannot be read aloud. Please read it on the screen."
    : choice?.usedFallback
      ? "No Urdu voice on this device: reading the Roman Urdu version."
      : undefined;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || !text.trim() || unreadable}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-card text-xs font-semibold font-body transition-all duration-200 border
        ${
          speaking
            ? "bg-rani-light text-rani border-rani/30 hover:bg-rani/20 animate-pulse"
            : "bg-paper-card text-text-muted border-line hover:border-line-strong hover:text-text hover:bg-paper-subtle"
        }
        disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      aria-label={speaking ? "Stop reading" : "Read aloud"}
      aria-pressed={speaking}
      title={title}
    >
      {speaking ? <Square className="w-3.5 h-3.5 fill-current" /> : <Volume2 className="w-3.5 h-3.5 text-jade" />}
      <span>{speaking ? "Stop" : "Listen"}</span>
    </button>
  );
}
