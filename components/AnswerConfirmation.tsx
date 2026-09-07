"use client";

import { Check, Edit3, ShieldAlert } from "lucide-react";
import { Button } from "./Button";
import { Card, CardContent } from "./Card";

interface AnswerConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fieldId: string;
  value: string;
  questionUrdu: string;
  fieldType?: "cnic" | "phone" | "date";
}

export const AnswerConfirmation = ({
  isOpen,
  onClose,
  onConfirm,
  value,
  questionUrdu,
}: AnswerConfirmationProps) => {
  if (!isOpen) return null;

  return (
    <Card variant="outlined" className="border-marigold/50 bg-marigold-light/30 shadow-md">
      <CardContent className="text-center py-6">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-marigold/15 text-marigold flex items-center justify-center">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold font-display text-text mb-1">
          Confirm Critical Information
        </h3>
        <p className="text-xs uppercase tracking-wider text-text-muted font-medium mb-3">
          Baraye Mehrbani Tasdeeq Karein
        </p>
        <p className="text-text mb-2 font-urdu text-xl leading-relaxed" dir="rtl">
          {questionUrdu}
        </p>
        <div className="inline-block px-4 py-2 my-2 rounded-xl bg-paper-card border border-marigold/30 shadow-inner">
          <p className="text-2xl font-mono font-bold text-text tracking-wide">{value}</p>
        </div>
        <div className="flex gap-3 justify-center mt-5">
          <Button variant="outline" size="sm" onClick={onClose} className="px-5">
            <Edit3 className="w-4 h-4" />
            Edit
          </Button>
          <Button variant="marigold" size="sm" onClick={onConfirm} className="px-5">
            <Check className="w-4 h-4" />
            Sahi Hai / Correct
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

AnswerConfirmation.displayName = "AnswerConfirmation";