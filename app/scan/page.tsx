"use client";

import { useState, useCallback } from "react";
import { ImageCapture } from "@/components/ImageCapture";
import { AudioRecorder } from "@/components/AudioRecorder";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/Card";
import { Button } from "@/components/Button";
import { Progress } from "@/components/Progress";
import { TTSButton } from "@/components/TTS";
import { scanForm, getNextQuestion, processAnswer } from "@/lib/api";
import { FormSchema } from "@/lib/types";

const REQUIRED_FIELD_ORDER = [
  "fullName",
  "fatherName",
  "cnic",
  "dateOfBirth",
  "phone",
  "city",
  "gender",
  "address",
  "district"
];

export default function ScanPage() {
  const [step, setStep] = useState<"capture" | "fields" | "interview" | "complete">("capture");
  const [formSchema, setFormSchema] = useState<FormSchema | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [currentFieldId, setCurrentFieldId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState<{
    fieldId: string;
    value: string;
    questionUrdu: string;
  } | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);

  const handleImageCapture = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const url = URL.createObjectURL(file);
      setOriginalImage(url);
      const schema = await scanForm(file);
      setFormSchema(schema);

      const initialAnswers: Record<string, string | null> = {};
      schema.fields.forEach(f => { initialAnswers[f.id] = null; });
      setAnswers(initialAnswers);

      const nextQ = await getNextQuestion(schema.fields, initialAnswers);
      if (nextQ.nextField) {
        setCurrentFieldId(nextQ.nextField);
        setCurrentQuestion(nextQ.questionUrdu);
      }

      setStep("fields");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to scan form. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const startInterview = useCallback(async () => {
    if (!formSchema) return;

    const nextQ = await getNextQuestion(formSchema.fields, answers);
    if (nextQ.nextField) {
      setCurrentFieldId(nextQ.nextField);
      setCurrentQuestion(nextQ.questionUrdu);
      setStep("interview");
    } else {
      setStep("complete");
    }
  }, [formSchema, answers]);

  const handleAnswerSubmit = useCallback(async (transcript: string) => {
    if (!currentFieldId || !formSchema) return;

    setLoading(true);
    setError(null);
    try {
      const field = formSchema.fields.find(f => f.id === currentFieldId);
      if (!field) return;

      const response = await processAnswer(currentFieldId, field.type, transcript);

      if (response.valid && response.value) {
        if (response.needsConfirmation) {
          setShowConfirmation({
            fieldId: currentFieldId,
            value: response.value,
            questionUrdu: field.questionUrdu
          });
        } else {
          setAnswers(prev => ({ ...prev, [currentFieldId]: response.value }));
          const nextQ = await getNextQuestion(formSchema.fields, { ...answers, [currentFieldId]: response.value });
          if (nextQ.nextField) {
            setCurrentFieldId(nextQ.nextField);
            setCurrentQuestion(nextQ.questionUrdu);
          } else {
            setStep("complete");
          }
        }
      } else {
        setError(response.error || "Invalid answer. Please try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process answer. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [currentFieldId, formSchema, answers]);

  const handleConfirm = useCallback(async (confirmed: boolean) => {
    if (!showConfirmation || !formSchema) return;

    if (confirmed) {
      setAnswers(prev => ({ ...prev, [showConfirmation.fieldId]: showConfirmation.value }));
      const nextQ = await getNextQuestion(
        formSchema.fields,
        { ...answers, [showConfirmation.fieldId]: showConfirmation.value }
      );
      if (nextQ.nextField) {
        setCurrentFieldId(nextQ.nextField);
        setCurrentQuestion(nextQ.questionUrdu);
        setStep("interview");
      } else {
        setStep("complete");
      }
    } else {
      setStep("interview");
    }
    setShowConfirmation(null);
  }, [showConfirmation, formSchema, answers]);

  const getFilledCount = () => Object.values(answers).filter(v => v !== null).length;
  const getRequiredCount = () => formSchema?.fields.filter(f => f.required).length || 0;

  if (step === "capture") {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-slate-900">Scan a Form</h1>
            <p className="mt-2 text-slate-600">
              Take a clear photo of your physical form or upload an image. The AI will identify all fields.
            </p>
          </div>

          <Card variant="elevated">
            <CardContent className="pt-0">
              <ImageCapture
                onImageCapture={handleImageCapture}
                disabled={loading}
              />
            </CardContent>
          </Card>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-center" role="alert">
              {error}
            </div>
          )}

          <p className="text-center text-sm text-slate-500">
            Make sure the entire form is visible with good lighting.
          </p>
        </div>
      </div>
    );
  }

  if (step === "fields") {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900">Detected Fields</h1>
            <Button variant="ghost" onClick={() => setStep("capture")}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>

          {formSchema && (
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>{formSchema.formTitle}</CardTitle>
                <CardDescription>{formSchema.fields.length} fields detected</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {formSchema.fields.map(field => (
                  <div key={field.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${field.required ? "bg-red-500" : "bg-slate-400"}`} />
                      <div>
                        <p className="font-medium text-slate-900">{field.label}</p>
                        <p className="text-sm text-slate-500">{field.type} {field.required ? "• Required" : "• Optional"}</p>
                      </div>
                    </div>
                    <TTSButton text={field.questionUrdu} className="shrink-0" />
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Button size="lg" className="w-full" onClick={startInterview} disabled={loading}>
                  {loading ? "Starting..." : "Start Voice Interview"}
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    );
  }

  if (step === "interview") {
    const field = formSchema?.fields.find(f => f.id === currentFieldId);
    const progress = getFilledCount();
    const total = getRequiredCount();

    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <Progress value={progress} max={total} showLabel label="Interview Progress" size="lg" />

          <Card variant="elevated">
            <CardContent className="pt-0 text-center py-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-green-100 flex items-center justify-center">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">{field?.questionUrdu || currentQuestion}</h2>
              <TTSButton text={field?.questionUrdu || currentQuestion || ""} className="mx-auto" />
              {field?.questionEnglish && (
                <p className="mt-2 text-slate-500">{field.questionEnglish}</p>
              )}
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent className="pt-0 space-y-4">
              <AudioRecorder
                onRecordingComplete={async (blob) => {
                  // NOTE: Speech-to-text transcription of interview answers is
                  // Agent 1 / backend responsibility (process-answer expects a
                  // transcript string). Until that's wired up, voice recording
                  // here just captures audio; the text field below is the
                  // reliable path for the frontend demo.
                }}
                showUploadFallback={false}
                disabled={loading}
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Or type your answer:</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Answer..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.currentTarget.value.trim()) {
                      handleAnswerSubmit(e.currentTarget.value.trim());
                      e.currentTarget.value = "";
                    }
                  }}
                  disabled={loading}
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("fields")}>
                  Back to Fields
                </Button>
              </div>
            </CardContent>
          </Card>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-center" role="alert">
              {error}
            </div>
          )}

          {showConfirmation && (
            <Card variant="outlined" className="border-amber-300 bg-amber-50">
              <CardContent className="pt-0 text-center py-6">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-amber-900 mb-2">Confirm Important Information</h3>
                <p className="text-amber-800 mb-2">{showConfirmation.questionUrdu}</p>
                <p className="text-2xl font-mono font-bold text-amber-900 mb-4">{showConfirmation.value}</p>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={() => handleConfirm(false)}>
                    Edit
                  </Button>
                  <Button onClick={() => handleConfirm(true)}>
                    ✓ Correct
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  if (step === "complete") {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Interview Complete!</h1>
            <p className="mt-2 text-slate-600">All required fields have been answered.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Your Answers</CardTitle>
                <CardDescription>Copy these to your physical form</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto">
                {REQUIRED_FIELD_ORDER.map(fieldId => {
                  const value = answers[fieldId];
                  const field = formSchema?.fields.find(f => f.id === fieldId);
                  if (!field || !value) return null;
                  return (
                    <div key={fieldId} className="flex items-start justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="flex-1 pr-4">
                        <p className="text-sm text-slate-500">{field.label}</p>
                        <p className="font-medium text-slate-900 break-all">{value}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <TTSButton text={value} />
                        <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(value)}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 012-2h10a2 2 0 012 2v1M8 5v15" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
              <CardFooter>
                <Button size="lg" className="w-full" onClick={() => {
                  const json = JSON.stringify(answers, null, 2);
                  navigator.clipboard.writeText(json);
                  alert("JSON copied to clipboard!");
                }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 012-2h10a2 2 0 012 2v1M8 5v15" />
                  </svg>
                  Copy All as JSON
                </Button>
              </CardFooter>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Original Form</CardTitle>
                <CardDescription>Reference for where to write each answer</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {originalImage && (
                  <div className="relative aspect-[4/3] bg-slate-100 rounded-xl overflow-hidden">
                    <img
                      src={originalImage}
                      alt="Original form"
                      className="w-full h-full object-contain p-4"
                    />
                  </div>
                )}
                {!originalImage && (
                  <div className="aspect-[4/3] bg-slate-100 rounded-xl flex items-center justify-center">
                    <p className="text-slate-500">Form image not available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button variant="outline" onClick={() => {
              setStep("capture");
              setFormSchema(null);
              setAnswers({});
              setCurrentFieldId(null);
              setCurrentQuestion(null);
              if (originalImage) URL.revokeObjectURL(originalImage);
              setOriginalImage(null);
            }}>
              Scan Another Form
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
