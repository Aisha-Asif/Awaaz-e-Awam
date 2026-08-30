"use client";

import { useCallback } from "react";
import { TTSButton } from "./TTS";
import { CardContent } from "./Card";

interface QuestionDisplayProps {
  questionUrdu: string;
  questionEnglish?: string;
  showTTS?: boolean;
}

export const QuestionDisplay = ({
  questionUrdu,
  questionEnglish,
  showTTS = true
}: QuestionDisplayProps) => {
  return (
    <CardContent>
      <h2 className="text-xl font-semibold text-slate-900 mb-2">
        {questionUrdu}
      </h2>
      {questionEnglish && (
        <p className="text-slate-500">{questionEnglish}</p>
      )}
      {showTTS && (
        <TTSButton text={questionUrdu} className="mt-3" />
      )}
    </CardContent>
  );
};

QuestionDisplay.displayName = "QuestionDisplay";