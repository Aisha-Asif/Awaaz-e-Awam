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
    <CardContent className="p-4 bg-paper-subtle rounded-card border border-line/60">
      <div className="flex justify-between items-start gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider font-semibold text-text-muted font-body mb-1">
            {fieldLabel}
          </p>
          <p className="font-semibold text-text font-body text-base break-all">
            {fieldValue}
          </p>
        </div>
        {showTTS && (
          <TTSButton text={fieldValue} className="shrink-0" />
        )}
      </div>
    </CardContent>
  );
};

AnswerCard.displayName = "AnswerCard";