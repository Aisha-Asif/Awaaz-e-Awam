"use client";

// FieldInput: the answer control for one interview question, chosen by the field's input mode.
//   type          -> typed only, with live validation (CNIC, phone, date). No microphone, so the value is never
//                    spoken, transcribed or sent to an AI.
//   choice        -> one button per option (gender, marital status, ...), and the same voice / typing
//                    controls as free text; what is said or typed is matched to an option.
//   voice-or-type -> microphone recorder, on-device speech button, or a text box (names, addresses, ...).
import { useState } from "react";
import { Button } from "@/components/Button";
import { AudioRecorder } from "@/components/AudioRecorder";
import { useSpeechRecognition } from "@/components/useSpeechRecognition";
import { effectiveInputMode } from "@/lib/field-model";
import { getFieldValidator } from "@/lib/validation";
import type { FormField, FormFieldType } from "@/lib/types";

type Props = {
  // The field being asked about (undefined only briefly while the page loads).
  field: FormField | undefined;
  // True while a request is in flight.
  disabled: boolean;
  // A typed (or on-device spoken) answer as text.
  onSubmitText: (text: string) => void | Promise<void>;
  // A finished microphone recording.
  onVoice: (blob: Blob) => void | Promise<void>;
  // A button choice.
  onChoice: (value: string) => void | Promise<void>;
};

const INPUT_CLASS =
  "w-full px-4 py-3 rounded-card border border-line bg-paper-card text-text placeholder-text-muted/70 focus:border-jade focus:ring-2 focus:ring-jade/20 focus:outline-none transition-all font-body text-base";

// Example format shown inside the typed box.
const PLACEHOLDERS: Partial<Record<FormFieldType, string>> = {
  cnic: "35202-1234567-1",
  phone: "03001234567",
  date: "DD/MM/YYYY",
};

export function FieldInput({ field, disabled, onSubmitText, onVoice, onChoice }: Props) {
  const mode = field ? effectiveInputMode(field) : "voice-or-type";

  if (field && mode === "type") {
    // key resets the typed text whenever the question changes.
    return <TypedInput key={field.id} field={field} disabled={disabled} onSubmitText={onSubmitText} />;
  }

  if (field && mode === "choice") {
    return (
      <div>
        <p className="block text-sm font-medium text-text mb-2 font-body">Choose one:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {field.options?.map((option) => (
            <Button key={option} variant="secondary" size="lg" disabled={disabled} onClick={() => onChoice(option)}>
              {option}
            </Button>
          ))}
        </div>
        <p className="mt-5 mb-2 text-sm font-medium text-text font-body">Or say it, or type it:</p>
        <VoiceOrTypeInput key={`voice-${field.id}`} disabled={disabled} onSubmitText={onSubmitText} onVoice={onVoice} />
      </div>
    );
  }

  return (
    <VoiceOrTypeInput key={field?.id ?? "none"} disabled={disabled} onSubmitText={onSubmitText} onVoice={onVoice} />
  );
}

// Typed-only answer: live validation, Enter or the Save button submits.
function TypedInput({
  field,
  disabled,
  onSubmitText,
}: {
  field: FormField;
  disabled: boolean;
  onSubmitText: (text: string) => void | Promise<void>;
}) {
  const [value, setValue] = useState("");
  const trimmed = value.trim();
  const result: { valid: boolean; normalized: string; error?: string } | null = trimmed
    ? getFieldValidator(field.type)(trimmed)
    : null;
  const canSave = !!result?.valid && !disabled;

  const submit = () => {
    if (!canSave) return;
    onSubmitText(trimmed);
    setValue("");
  };

  return (
    <div>
      <div
        className="mb-3 p-3 rounded-card bg-marigold/10 border border-marigold/30 text-sm text-text-muted font-body"
        role="note"
      >
        For your privacy, type this one. Please do not say it out loud.
        <span className="block font-urdu text-base mt-1 leading-relaxed" dir="rtl">
          آپ کی رازداری کے لیے اسے ٹائپ کریں، بول کر نہ بتائیں۔
        </span>
      </div>
      <label className="block text-sm font-medium text-text mb-2 font-body" htmlFor={`typed-${field.id}`}>
        Type your answer:
      </label>
      <input
        id={`typed-${field.id}`}
        type="text"
        inputMode="tel"
        autoComplete="off"
        className={INPUT_CLASS}
        placeholder={PLACEHOLDERS[field.type] ?? ""}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        disabled={disabled}
        autoFocus
      />
      {result && !result.valid && (
        <p className="mt-2 text-sm text-rani font-body" role="alert">
          {result.error}
        </p>
      )}
      <Button className="mt-3 w-full" size="lg" disabled={!canSave} onClick={submit}>
        Save
      </Button>
    </div>
  );
}

// Free-text answer: microphone, on-device speech, or typing.
function VoiceOrTypeInput({
  disabled,
  onSubmitText,
  onVoice,
}: {
  disabled: boolean;
  onSubmitText: (text: string) => void | Promise<void>;
  onVoice: (blob: Blob) => void | Promise<void>;
}) {
  const { supported, listening, error, start, stop } = useSpeechRecognition("ur-PK");
  // The typed answer. It is kept if the answer is rejected so it can be corrected, and cleared when the question changes
  // (this component is keyed by the field id).
  const [typed, setTyped] = useState("");
  const canSave = typed.trim().length > 0 && !disabled;

  const saveTyped = () => {
    if (canSave) onSubmitText(typed.trim());
  };

  return (
    <div>
      <AudioRecorder onRecordingComplete={onVoice} showUploadFallback={false} disabled={disabled} />
      <div className="mt-4">
        <label htmlFor="typed-answer" className="block text-sm font-medium text-text mb-2 font-body">
          Or type your answer:
        </label>
        <div className="flex gap-2">
          <input
            id="typed-answer"
            type="text"
            enterKeyHint="send"
            autoComplete="off"
            className={INPUT_CLASS}
            placeholder="Answer in Urdu (اردو) or English..."
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                saveTyped();
              }
            }}
            disabled={disabled}
            autoFocus
          />
          <Button type="button" className="shrink-0" disabled={!canSave} onClick={saveTyped}>
            Save
          </Button>
        </div>
      </div>
      {supported && (
        <div className="mt-4">
          <Button
            variant="outline"
            className="w-full"
            disabled={disabled || listening}
            onClick={() => (listening ? stop() : start((text) => onSubmitText(text)))}
          >
            {listening ? "Listening..." : "Tap to speak (on-device)"}
          </Button>
        </div>
      )}
      {error && (
        <div
          className="mt-3 p-3 bg-rani/10 border border-rani/30 rounded-card text-rani text-sm text-center font-body"
          role="alert"
        >
          {error}
        </div>
      )}
    </div>
  );
}
