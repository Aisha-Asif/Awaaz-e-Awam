"use client";

import { useState, useCallback } from "react";
import { AudioRecorder } from "@/components/AudioRecorder";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/Card";
import { Button } from "@/components/Button";
import { Progress } from "@/components/Progress";
import { TTSButton } from "@/components/TTS";
import { processSpeech, getNextQuestion, processAnswer } from "@/lib/api";
import { FormSchema, ProcessSpeechResponse } from "@/lib/types";

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

export default function SpeakPage() {
  const [step, setStep] = useState<"record" | "review" | "interview" | "complete">("record");
  const [speechResponse, setSpeechResponse] = useState<ProcessSpeechResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [currentFieldId, setCurrentFieldId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [formSchema, setFormSchema] = useState<FormSchema | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState<{
    fieldId: string;
    value: string;
    questionUrdu: string;
  } | null>(null);

  const handleRecordingComplete = useCallback(async (audioBlob: Blob) => {
    setLoading(true);
    setError(null);
    try {
      const audioFile = new File([audioBlob], "recording.webm", { type: "audio/webm" });
      const response = await processSpeech(audioFile);
      setSpeechResponse(response);

      const schema: FormSchema = {
        formTitle: "Citizen Information Form",
        fields: REQUIRED_FIELD_ORDER.map(id => ({
          id,
          label: id,
          type: "text" as const,
          required: ["fullName", "fatherName", "cnic", "dateOfBirth", "phone", "city"].includes(id),
          questionUrdu: ""
        }))
      };
      setFormSchema(schema);

      const extractedAnswers: Record<string, string | null> = {};
      for (const [key, value] of Object.entries(response.extracted)) {
        if (value) extractedAnswers[key] = value;
      }
      setAnswers(extractedAnswers);

      // Use the freshly-built schema (not the stale `formSchema` state) so the
      // very first next-question lookup has fields to match against.
      const nextQ = await getNextQuestion(schema.fields, extractedAnswers);
      if (nextQ.nextField) {
        setCurrentFieldId(nextQ.nextField);
        setCurrentQuestion(nextQ.questionUrdu);
      }

      setStep("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process speech. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleEditField = useCallback((fieldId: string) => {
    setCurrentFieldId(fieldId);
    const field = formSchema?.fields.find(f => f.id === fieldId);
    setCurrentQuestion(field?.questionUrdu || "");
    setStep("interview");
  }, [formSchema?.fields]);

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

  const getMissingRequiredFields = () => {
    if (!speechResponse) return [];
    return REQUIRED_FIELD_ORDER.filter(id => !answers[id] && ["fullName", "fatherName", "cnic", "dateOfBirth", "phone", "city"].includes(id));
  };

  const getFilledFields = () => {
    return Object.entries(answers).filter(([_, value]) => value !== null);
  };

  if (step === "record") {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-slate-900">Speak Naturally</h1>
            <p className="mt-2 text-slate-600">
              Record your information in Urdu or Roman Urdu. We&apos;ll extract the form fields for you.
            </p>
          </div>

          <Card variant="elevated">
            <CardContent className="pt-0">
              <AudioRecorder
                onRecordingComplete={handleRecordingComplete}
                disabled={loading}
              />
            </CardContent>
          </Card>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-center" role="alert">
              {error}
            </div>
          )}

          <div className="text-center text-sm text-slate-500">
            <p>Example: &quot;Mera naam Ali Raza hai, mere abu ka naam Ahmed Raza hai, main Lahore mein rehta hoon.&quot;</p>
          </div>
        </div>
      </div>
    );
  }

  if (step === "review") {
    const filledFields = getFilledFields();
    const missingFields = getMissingRequiredFields();

    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900">Review Information</h1>
            <Button variant="ghost" onClick={() => setStep("record")}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>

          {speechResponse && (
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Transcript</CardTitle>
                <CardDescription>What we heard from your recording</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="bg-slate-50 p-4 rounded-xl text-slate-700 whitespace-pre-wrap">{speechResponse.transcript}</p>
              </CardContent>
            </Card>
          )}

          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Extracted Information</CardTitle>
              <CardDescription>{filledFields.length} fields filled, {missingFields.length} required fields missing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {filledFields.map(([fieldId, value]) => {
                const field = formSchema?.fields.find(f => f.id === fieldId);
                return (
                  <div key={fieldId} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex-1">
                      <p className="text-sm text-slate-500">{field?.label || fieldId}</p>
                      <p className="font-medium text-slate-900">{value}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleEditField(fieldId)}>
                      Edit
                    </Button>
                  </div>
                );
              })}

              {missingFields.length > 0 && (
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-sm font-medium text-slate-700 mb-3">Missing required fields:</p>
                  <ul className="space-y-2">
                    {missingFields.map(fieldId => {
                      const field = formSchema?.fields.find(f => f.id === fieldId);
                      return (
                        <li key={fieldId} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                          <div>
                            <p className="text-sm text-amber-800">{field?.label || fieldId}</p>
                            <p className="text-xs text-amber-600">Required</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => handleEditField(fieldId)}>
                            Fill
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </CardContent>
            <CardFooter>
              {missingFields.length > 0 && (
                <Button size="lg" className="w-full" onClick={() => handleEditField(missingFields[0])}>
                  Continue to Interview
                </Button>
              )}
              {missingFields.length === 0 && (
                <Button size="lg" className="w-full" onClick={() => setStep("complete")}>
                  View Complete Form
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  if (step === "interview") {
    const field = formSchema?.fields.find(f => f.id === currentFieldId);
    const progress = Object.keys(answers).filter(k => answers[k]).length;
    const totalRequired = REQUIRED_FIELD_ORDER.filter(id => formSchema?.fields.find(f => f.id === id)?.required).length;

    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <Progress value={progress} max={totalRequired} showLabel label="Interview Progress" size="lg" />

          <Card variant="elevated">
            <CardContent className="pt-0 text-center py-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-blue-100 flex items-center justify-center">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <CardContent className="pt-0">
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
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Or type your answer:</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Answer in Urdu or English..."
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

          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => setStep("review")}>
              Back to Review
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "complete") {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Form Complete!</h1>
            <p className="mt-2 text-slate-600">All required fields have been filled.</p>
          </div>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Your Information</CardTitle>
              <CardDescription>Ready to copy or use on your physical form</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {REQUIRED_FIELD_ORDER.map(fieldId => {
                const value = answers[fieldId];
                const field = formSchema?.fields.find(f => f.id === fieldId);
                if (!field || !value) return null;
                return (
                  <div key={fieldId} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div>
                      <p className="text-sm text-slate-500">{field.label}</p>
                      <p className="font-medium text-slate-900">{value}</p>
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

          <div className="text-center">
            <Button variant="outline" onClick={() => {
              setStep("record");
              setSpeechResponse(null);
              setAnswers({});
              setCurrentFieldId(null);
              setCurrentQuestion(null);
            }}>
              Start New Form
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
