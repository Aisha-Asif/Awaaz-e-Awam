"use client";

import { useState, useRef } from "react";
import { AudioRecorder } from "./AudioRecorder";
import { Button } from "./Button";
import { TTSButton } from "./TTS";

interface AnswerInputProps {
  onAnswerSubmit: (transcript: string) => void;
  onEdit?: () => void;
  disabled?: boolean;
  showVoiceRecorder?: boolean;
}

export const AnswerInput = ({
  onAnswerSubmit,
  onEdit,
  disabled = false,
  showVoiceRecorder = true
}: AnswerInputProps) => {
  const [typing, setTyping] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleTypingSubmit = () => {
    if (inputRef.current && inputRef.current.value.trim()) {
      onAnswerSubmit(inputRef.current.value.trim());
      setTyping("");
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        Or type your answer:
      </label>
      <div className="space-y-3">
        <AudioRecorder
          onRecordingComplete={audioBlob => {
            // In a real app, this would send to backend for STT
            // For mock, we'll just treat it as processed
            setTyping("Processing audio...");
          }}
          showUploadFallback={true}
          disabled={disabled}
        />
        <input
          ref={inputRef}
          type="text"
          defaultValue={typing}
          onChange={(e) => {
            const target = e.target as HTMLInputElement;
            if (target) {
              setTyping(target.value);
            }
          }}
          placeholder="Answer in Urdu or English..."
          className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          disabled={disabled}
          autoFocus
        />
      </div>
      {onEdit && (
        <Button variant="ghost" size="sm" className="mt-2 w-full">
          Edit previous answer
        </Button>
      )}
      <div className="mt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleTypingSubmit}
          disabled={disabled}
        >
          Submit
        </Button>
      </div>
    </div>
  );
};

AnswerInput.displayName = "AnswerInput";