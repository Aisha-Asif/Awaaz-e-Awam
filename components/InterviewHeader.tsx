"use client";

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
    <CardContent className="pt-0 text-center py-8">
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-blue-100 flex items-center justify-center">
        <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">{questionUrdu}</h2>
      {questionEnglish && (
        <p className="mt-2 text-slate-500">{questionEnglish}</p>
      )}
      {showTTS && (
        <TTSButton text={questionUrdu} className="mx-auto" />
      )}
    </CardContent>
  );
};

InterviewHeader.displayName = "InterviewHeader";