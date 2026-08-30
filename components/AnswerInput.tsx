"use client";

import { useState } from "react";
import { AudioRecorder } from "./AudioRecorder";
import { Button } from "./Button";

interface AnswerInputProps {
  onAnswerSubmit: (answer: string) => void;
  onEdit?: () => void;
  disabled?: boolean;
  placeholder?: string;
  showVoiceRecorder?: boolean;
}

export const AnswerInput = ({
  onAnswerSubmit,
  onEdit,
  disabled = false,
  placeholder = "Answer in Urdu or English...",
  showVoiceRecorder = true
}: AnswerInputProps) => {
  const [typing, setTyping] = useState("");

  const handleTypingSubmit = (value: string) => {
    if (value.trim()) {
      onAnswerSubmit(value.trim());
      setTyping("");
    }
  };

  return (
    <div>
      <textarea
        placeholder={placeholder}
        value={typing}
        onChange={(e) => setTyping(e.target.value)}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === "Enter" && (e.target as HTMLTextAreaElement).value.trim()) {
            handleTypingSubmit((e.target as HTMLTextAreaElement).value);
          }
        }}
        className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        disabled={disabled}
        rows={4}
        autoFocus
      />
      <div className="mt-3">
        <AudioRecorder
          onRecordingComplete={audioBlob => {
            setTyping("Processing audio...");
          }}
          showUploadFallback={true}
          disabled={disabled}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleTypingSubmit(typing)}
          disabled={disabled}
        >
          Submit
        </Button>
      </div>
      {onEdit && (
        <Button variant="ghost" size="sm" className="mt-2 w-full">
          Edit previous answer
        </Button>
      )}
    </div>
  );
};

AnswerInput.displayName = "AnswerInput";