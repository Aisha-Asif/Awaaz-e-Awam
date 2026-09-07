"use client";

import { useState } from "react";
import { CheckCircle2, Copy, Check, RotateCcw } from "lucide-react";
import { Button } from "./Button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "./Card";
import { TTSButton } from "./TTS";

interface CompletionScreenProps {
  answers: Record<string, string | null>;
  formSchema: any;
  onCopyJSON: () => void;
  onRestart: () => void;
}

export const CompletionScreen = ({
  answers,
  formSchema,
  onCopyJSON,
  onRestart
}: CompletionScreenProps) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const requiredFields = [
    "fullName",
    "fatherName",
    "cnic",
    "dateOfBirth",
    "phone",
    "city"
  ];

  const handleCopyField = (fieldId: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopyAll = () => {
    onCopyJSON();
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <Card variant="elevated" padding="lg" className="border-line shadow-md">
      <CardHeader className="text-center pb-2">
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-jade-light text-jade flex items-center justify-center">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <CardTitle className="text-2xl sm:text-3xl text-text font-display">
          Form Answers Ready!
        </CardTitle>
        <CardDescription className="text-sm sm:text-base font-body text-text-muted">
          All required information has been verified and organized.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 pt-4">
        {requiredFields.map(fieldId => {
          const field = formSchema?.fields.find((f: any) => f.id === fieldId);
          const value = answers[fieldId];
          if (!field || !value) return null;

          return (
            <div
              key={fieldId}
              className="flex items-center justify-between p-3.5 sm:p-4 bg-paper-subtle rounded-card border border-line/60 gap-3"
            >
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-xs uppercase tracking-wider font-semibold text-text-muted font-body">
                  {field.label}
                </p>
                <p className="font-semibold text-text font-body text-base truncate mt-0.5" title={value}>
                  {value}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <TTSButton text={value} />
                <button
                  type="button"
                  onClick={() => handleCopyField(fieldId, value)}
                  className="p-2 text-text-muted hover:text-text hover:bg-paper-card rounded-card border border-transparent hover:border-line transition-all duration-200"
                  title="Copy to clipboard"
                  aria-label={`Copy ${field.label}`}
                >
                  {copiedField === fieldId ? (
                    <Check className="w-4 h-4 text-jade" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </CardContent>

      <CardFooter className="flex-col sm:flex-row gap-3 pt-6 border-t border-line mt-6">
        <Button size="lg" variant="jade" onClick={handleCopyAll} className="w-full sm:w-auto flex-1">
          {copiedAll ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          {copiedAll ? "Copied All JSON!" : "Copy All Form Answers"}
        </Button>
        <Button variant="outline" size="lg" onClick={onRestart} className="w-full sm:w-auto">
          <RotateCcw className="w-4 h-4" />
          Start New Form
        </Button>
      </CardFooter>
    </Card>
  );
};

CompletionScreen.displayName = "CompletionScreen";