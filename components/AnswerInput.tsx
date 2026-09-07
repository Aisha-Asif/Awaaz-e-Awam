"use client";

import { useState } from "react";
import { Send, CornerDownLeft } from "lucide-react";
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
  placeholder = "Type in Urdu (اردو) or English...",
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
    <div className="space-y-4">
      {showVoiceRecorder && (
        <div className="p-4 bg-paper-card rounded-card border border-line shadow-sm">
          <AudioRecorder
            onRecordingComplete={audioBlob => {
              setTyping("Processing voice note...");
            }}
            showUploadFallback={true}
            disabled={disabled}
          />
        </div>
      )}

      <div className="relative">
        <textarea
          placeholder={placeholder}
          value={typing}
          onChange={(e) => setTyping(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === "Enter" && !e.shiftKey && (e.target as HTMLTextAreaElement).value.trim()) {
              e.preventDefault();
              handleTypingSubmit((e.target as HTMLTextAreaElement).value);
            }
          }}
          className="w-full px-4 py-3 rounded-card border border-line bg-paper-card text-text placeholder-text-muted/70 focus:border-jade focus:ring-2 focus:ring-jade/20 focus:outline-none transition-all duration-200 font-body text-base"
          disabled={disabled}
          rows={3}
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-text-muted font-body">
            Press Enter ↵ to submit
          </span>
          <Button
            variant="jade"
            size="sm"
            onClick={() => handleTypingSubmit(typing)}
            disabled={disabled || !typing.trim()}
          >
            <Send className="w-4 h-4" />
            Submit Answer
          </Button>
        </div>
      </div>

      {onEdit && (
        <Button variant="ghost" size="sm" className="w-full text-text-muted" onClick={onEdit}>
          Edit previous answer
        </Button>
      )}
    </div>
  );
};

AnswerInput.displayName = "AnswerInput";