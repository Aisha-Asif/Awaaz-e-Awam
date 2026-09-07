"use client";

import { TTSButton } from "./TTS";
import { CardContent } from "./Card";

interface QuestionCardProps {
  questionUrdu: string;
  questionEnglish?: string;
  showTTS?: boolean;
}

export const QuestionCard = ({
  questionUrdu,
  questionEnglish,
  showTTS = true
}: QuestionCardProps) => {
  return (
    <CardContent className="space-y-4 text-center sm:text-left">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div className="flex-1 w-full space-y-2">
          <h2
            className="text-2xl sm:text-3xl font-urdu text-text leading-relaxed tracking-normal"
            dir="rtl"
          >
            {questionUrdu}
          </h2>
          {questionEnglish && (
            <p className="text-sm sm:text-base text-text-muted font-body font-normal">
              {questionEnglish}
            </p>
          )}
        </div>
        {showTTS && (
          <div className="shrink-0 self-center sm:self-start">
            <TTSButton text={questionUrdu} />
          </div>
        )}
      </div>
    </CardContent>
  );
};

QuestionCard.displayName = "QuestionCard";