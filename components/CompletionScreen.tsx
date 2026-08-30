"use client";

import { Button } from "./Button";
import { Card, CardContent, CardFooter } from "./Card";
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
  const requiredFields = [
    "fullName",
    "fatherName",
    "cnic",
    "dateOfBirth",
    "phone",
    "city"
  ];

  return (
    <Card variant="elevated">
      <CardContent className="space-y-4">
        <h2 className="text-3xl font-bold text-slate-900">Form Complete!</h2>
        <p>All required fields have been filled.</p>

        <div className="space-y-4">
          {requiredFields.map(fieldId => {
            const field = formSchema?.fields.find((f: any) => f.id === fieldId);
            const value = answers[fieldId];
            if (!field || !value) return null;

            return (
              <div key={fieldId} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-sm text-slate-500">{field.label}</p>
                  <p className="font-medium text-slate-900">{value}</p>
                </div>
                <TTSButton text={value} />
                <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(value)}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 012-2h10a2 2 0 012 2v1M8 5v15" />
                  </svg>
                  Copy
                </Button>
              </div>
            );
          })}
        </div>

        <CardFooter>
          <Button size="lg" onClick={onCopyJSON}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 012-2h10a2 2 0 012 2v1M8 5v15" />
            </svg>
            Copy All as JSON
          </Button>
          <Button variant="outline" size="lg" onClick={onRestart}>
            Start New Form
          </Button>
        </CardFooter>
      </CardContent>
    </Card>
  );
};

CompletionScreen.displayName = "CompletionScreen";