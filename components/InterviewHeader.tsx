"use client";

import { MessageSquareQuote } from "lucide-react";
import { TTSButton } from "./TTS";
import { CardContent } from "./Card";

interface InterviewHeaderProps {
  questionUrdu: string;
  questionEnglish?: string;
  showTTS?: boolean;
}

export const InterviewHeader = ({
  questionUrdu,
  questionEnglish,
  showTTS = true
}: InterviewHeaderProps) => {
  return (
    <CardContent className="text-center py-6">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-jade/10 text-jade flex items-center justify-center border border-jade/20 shadow-sm">
        <MessageSquareQuote className="w-8 h-8" />
      </div>
      <h2
        className="text-2xl sm:text-3xl font-urdu text-text mb-3 leading-relaxed"
        dir="rtl"
      >
        {questionUrdu}
      </h2>
      {questionEnglish && (
        <p className="text-sm sm:text-base text-text-muted font-body max-w-lg mx-auto mb-4">
          {questionEnglish}
        </p>
      )}
      {showTTS && (
        <div className="flex justify-center mt-2">
          <TTSButton text={questionUrdu} />
        </div>
      )}
    </CardContent>
  );
};

InterviewHeader.displayName = "InterviewHeader";