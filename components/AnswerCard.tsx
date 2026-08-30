"use client";

import { TTSButton } from "./TTS";
import { CardContent } from "./Card";

interface AnswerCardProps {
  fieldLabel: string;
  fieldValue: string | null;
  showTTS?: boolean;
}

export const AnswerCard = ({
  fieldLabel,
  fieldValue,
  showTTS = true
}: AnswerCardProps) => {
  if (!fieldValue) return null;

  return (
    <CardContent className="p-4 bg-slate-50 rounded-xl">
      <div className="flex justify-between items-start">
        <p className="text-sm text-slate-500">{fieldLabel}</p>
        <p className="font-medium text-slate-900 break-all">{fieldValue}</p>
      </div>
      {showTTS && (
        <TTSButton text={fieldValue} className="mt-2" />
      )}
    </CardContent>
  );
};

AnswerCard.displayName = "AnswerCard";