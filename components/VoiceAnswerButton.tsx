"use client";

import { useCallback } from "react";
import { TTSButton } from "./TTS";

interface VoiceAnswerButtonProps {
  isSpeaking: boolean;
  onSpeak: () => void;
  onStop: () => void;
  questionUrdu: string;
}

export const VoiceAnswerButton = ({
  isSpeaking,
  onSpeak,
  onStop,
  questionUrdu
}: VoiceAnswerButtonProps) => {
  return (
    <TTSButton
      text={questionUrdu}
      className="w-full mt-2"
      disabled={isSpeaking}
    />
  );
};

VoiceAnswerButton.displayName = "VoiceAnswerButton";