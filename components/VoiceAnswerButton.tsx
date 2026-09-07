"use client";

import { Volume2, VolumeX, Mic, Square } from "lucide-react";
import { Button } from "./Button";
import { TTSButton } from "./TTS";

interface VoiceAnswerButtonProps {
  isSpeaking?: boolean;
  onSpeak?: () => void;
  onStop?: () => void;
  questionUrdu?: string;
  isRecording?: boolean;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  className?: string;
}

export const VoiceAnswerButton = ({
  isSpeaking = false,
  onSpeak,
  onStop,
  questionUrdu,
  isRecording = false,
  onStartRecording,
  onStopRecording,
  className = "",
}: VoiceAnswerButtonProps) => {
  if (onStartRecording || onStopRecording) {
    return (
      <Button
        variant={isRecording ? "rani" : "primary"}
        size="lg"
        onClick={isRecording ? onStopRecording : onStartRecording}
        className={`w-full flex items-center justify-center gap-2 font-body font-semibold ${className}`}
      >
        {isRecording ? (
          <>
            <Square className="w-5 h-5 fill-current" />
            <span>Stop Recording / ریکارڈنگ بند کریں</span>
          </>
        ) : (
          <>
            <Mic className="w-5 h-5" />
            <span>Record Voice Answer / آواز ریکارڈ کریں</span>
          </>
        )}
      </Button>
    );
  }

  if (questionUrdu) {
    return (
      <div className={`w-full ${className}`}>
        <TTSButton
          text={questionUrdu}
          className="w-full justify-center"
          disabled={isSpeaking}
        />
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="md"
      onClick={isSpeaking ? onStop : onSpeak}
      className={`w-full flex items-center justify-center gap-2 font-body ${className}`}
    >
      {isSpeaking ? (
        <>
          <VolumeX className="w-4 h-4 text-rani" />
          <span>Stop Audio</span>
        </>
      ) : (
        <>
          <Volume2 className="w-4 h-4 text-jade" />
          <span>Listen to Question</span>
        </>
      )}
    </Button>
  );
};

VoiceAnswerButton.displayName = "VoiceAnswerButton";