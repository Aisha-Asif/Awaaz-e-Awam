"use client";

import Link from "next/link";
import { useState, useCallback, useEffect, ReactNode } from "react";
import { AudioRecorder } from "@/components/AudioRecorder";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/Card";
import { Button } from "@/components/Button";
import { Progress } from "@/components/Progress";
import { TTSButton } from "@/components/TTS";
import { useSpeechRecognition } from "@/components/useSpeechRecognition";
import { processSpeech, getNextQuestion, processAnswer, transcribeAudioFile } from "@/lib/api";
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

function PageHeader() {
  return (
    <header>
      <div className="headerbar">
        <Link href="/" className="wordmark">
          <span className="lat">Awaaz-e-Awam</span>
          <span className="urd urdu">آواز عوام</span>
        </Link>
      </div>
    </header>
  );
}

function PageBackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 mb-6 font-body text-text-muted hover:text-text transition-colors">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      {children}
    </Link>
  );
}

function PageFooter() {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-bottom">
          <span>Awaaz-e-Awam — Multi-Dialect Urdu Voice-to-Form Assistant</span>
          <span>Your voice. Your forms.</span>
        </div>
      </div>
    </footer>
  );
}

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
  const [justSaved, setJustSaved] = useState(false);
  const {
    supported: srSupported,
    listening: srListening,
    error: srError,
    start: srStart,
    stop: srStop
  } = useSpeechRecognition("ur-PK");

  useEffect(() => {
    if (!justSaved) return;
    const t = setTimeout(() => setJustSaved(false), 2000);
    return () => clearTimeout(t);
  }, [justSaved]);

  useEffect(() => {
    if (step === "record") return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [step]);

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
          const nextAnswers = { ...answers, [currentFieldId]: response.value };
          setAnswers(nextAnswers);
          setJustSaved(true);
          const nextQ = await getNextQuestion(formSchema.fields, nextAnswers);
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
      const nextAnswers = { ...answers, [showConfirmation.fieldId]: showConfirmation.value };
      setAnswers(nextAnswers);
      setJustSaved(true);
      const nextQ = await getNextQuestion(
        formSchema.fields,
        nextAnswers
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
    return Object.entries(answers).filter(([, value]) => value !== null);
  };

  if (step === "record") {
    return (
      <>
        <PageHeader />
        <section className="section">
          <div className="wrap" style={{maxWidth:720}}>
            <PageBackLink href="/">Back to home</PageBackLink>
            <div className="section-head" style={{textAlign:"center",marginBottom:32}}>
              <h2>Speak Naturally</h2>
              <p>Record your information in Urdu or Roman Urdu. We&apos;ll extract the form fields for you.</p>
            </div>

            <Card variant="elevated" padding="lg">
              <CardContent>
                <AudioRecorder
                  onRecordingComplete={handleRecordingComplete}
                  disabled={loading}
                />
              </CardContent>
            </Card>

            {error && (
              <div className="p-4 bg-rani/10 border border-rani/30 rounded-card text-rani text-center font-body mt-4" role="alert">
                {error}
              </div>
            )}

            <p className="text-center text-sm text-text-muted mt-6 font-body" style={{maxWidth:520,margin:"24px auto 0"}}>
              Example: &quot;Mera naam Ali Raza hai, mere abu ka naam Ahmed Raza hai, main Lahore mein rehta hoon.&quot;
            </p>
          </div>
        </section>
        <PageFooter />
      </>
    );
  }

  if (step === "review") {
    const filledFields = getFilledFields();
    const missingFields = getMissingRequiredFields();

    return (
      <>
        <PageHeader />
        <section className="section">
          <div className="wrap" style={{maxWidth:720}}>
            <Button variant="ghost" onClick={() => setStep("record")}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Recording
            </Button>
            <div className="section-head">
              <h2>Review Information</h2>
              <p>Check what we extracted from your recording.</p>
            </div>

            {speechResponse && (
              <Card variant="elevated" padding="lg">
                <CardHeader>
                  <CardTitle>Transcript</CardTitle>
                  <CardDescription>What we heard from your recording</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="bg-paper p-4 rounded-card text-text font-body whitespace-pre-wrap">{speechResponse.transcript}</p>
                </CardContent>
              </Card>
            )}

            <Card variant="elevated" padding="lg">
              <CardHeader>
                <CardTitle>Extracted Information</CardTitle>
                <CardDescription>{filledFields.length} fields filled, {missingFields.length} required fields missing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {filledFields.map(([fieldId, value]) => {
                  const field = formSchema?.fields.find(f => f.id === fieldId);
                  return (
                    <div key={fieldId} className="flex items-center justify-between p-3 bg-paper rounded-card">
                      <div className="flex-1">
                        <p className="text-sm text-text-muted font-body">{field?.label || fieldId}</p>
                        <p className="font-medium text-text font-body">{value}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleEditField(fieldId)}>
                        Edit
                      </Button>
                    </div>
                  );
                })}

                {missingFields.length > 0 && (
                  <div className="pt-4 border-t border-line">
                    <p className="text-sm font-medium text-text mb-3 font-body">Missing required fields:</p>
                    <ul className="space-y-2">
                      {missingFields.map(fieldId => {
                        const field = formSchema?.fields.find(f => f.id === fieldId);
                        return (
                          <li key={fieldId} className="flex items-center justify-between p-3 bg-marigold/10 rounded-card">
                            <div>
                              <p className="text-sm text-marigold font-body">{field?.label || fieldId}</p>
                              <p className="text-xs text-marigold/70 font-body">Required</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleEditField(fieldId)}>
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
        </section>
        <PageFooter />
      </>
    );
  }

  if (step === "interview") {
    const field = formSchema?.fields.find(f => f.id === currentFieldId);
    const progress = Object.keys(answers).filter(k => answers[k]).length;
    const totalRequired = REQUIRED_FIELD_ORDER.filter(id => formSchema?.fields.find(f => f.id === id)?.required).length;

    return (
      <>
        <PageHeader />
        <section className="section">
          <div className="wrap" style={{maxWidth:640}}>
<Button variant="ghost" onClick={() => setStep("review")}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Review
              </Button>
            <div className="mb-6">
              <Progress value={progress} max={totalRequired} showLabel label="Interview Progress" size="lg" />
            </div>

            <Card variant="elevated" padding="lg">
              <CardContent className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-6 rounded-card bg-rani/10 flex items-center justify-center">
                  <svg className="w-10 h-10 text-rani" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold font-display text-text mb-2">{field?.questionUrdu || currentQuestion}</h2>
                <div className="mt-3 flex justify-center">
                  <TTSButton text={field?.questionUrdu || currentQuestion || ""} />
                </div>
                {field?.questionEnglish && (
                  <p className="mt-2 text-text-muted font-body">{field.questionEnglish}</p>
                )}
              </CardContent>
            </Card>

            <Card variant="elevated" padding="lg">
              <CardContent>
                <AudioRecorder
                  onRecordingComplete={async (blob) => {
                    setLoading(true);
                    setError(null);
                    try {
                      const transcript = await transcribeAudioFile(blob);
                      await handleAnswerSubmit(transcript);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Could not transcribe your answer. Please try again.");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  showUploadFallback={false}
                  disabled={loading}
                />
                <div className="mt-4">
                  <label className="block text-sm font-medium text-text mb-2 font-body">Or type your answer:</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-card border-2 border-line bg-paper-card text-text placeholder-text-muted focus:border-marigold focus:ring-0 focus:outline-none font-body"
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
                {srSupported && (
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={loading || srListening}
                      onClick={() => {
                        if (srListening) {
                          srStop();
                        } else {
                          srStart((text) => handleAnswerSubmit(text));
                        }
                      }}
                    >
                      {srListening ? "Listening..." : "Tap to speak (on-device)"}
                    </Button>
                  </div>
                )}
                {srError && (
                  <div className="mt-3 p-3 bg-rani/10 border border-rani/30 rounded-card text-rani text-sm text-center font-body" role="alert">
                    {srError}
                  </div>
                )}
                {currentFieldId && answers[currentFieldId] && (
                  <p className="mt-3 text-sm text-jade font-medium break-words">
                    Answer: <span className="font-body">{answers[currentFieldId]}</span>
                  </p>
                )}
                {justSaved && (
                  <p className="mt-3 flex items-center gap-2 text-sm font-medium text-jade" role="status">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Answer saved
                  </p>
                )}
              </CardContent>
            </Card>

            {error && (
              <div className="p-4 bg-rani/10 border border-rani/30 rounded-card text-rani text-center font-body" role="alert">
                {error}
              </div>
            )}

            {showConfirmation && (
              <Card variant="outlined" padding="lg" className="border-marigold bg-marigold/10">
                <CardContent className="text-center py-6">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-marigold/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-marigold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold font-display text-marigold mb-2">Confirm Important Information</h3>
                  <p className="text-text-muted mb-2 font-body">{showConfirmation.questionUrdu}</p>
                  <p className="text-2xl font-mono font-bold text-text mb-4">{showConfirmation.value}</p>
                  <div className="flex gap-3 justify-center">
                    <Button variant="ghost" onClick={() => handleConfirm(false)}>
                      Edit
                    </Button>
                    <Button onClick={() => handleConfirm(true)}>
                      Correct
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
        <PageFooter />
      </>
    );
  }

  if (step === "complete") {
    return (
      <>
        <PageHeader />
        <section className="section">
          <div className="wrap" style={{maxWidth:720}}>
            <PageBackLink href="/">Back to home</PageBackLink>
            <div className="section-head" style={{textAlign:"center",marginBottom:32}}>
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-jade/10 flex items-center justify-center">
                <svg className="w-10 h-10 text-jade" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2>Form Complete!</h2>
              <p>All required fields have been filled.</p>
            </div>

            <Card variant="elevated" padding="lg">
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
                    <div key={fieldId} className="flex items-center justify-between p-3 bg-paper rounded-card">
                      <div>
                        <p className="text-sm text-text-muted font-body">{field.label}</p>
                        <p className="font-medium text-text font-body">{value}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <TTSButton text={value} />
                        <button
                          onClick={() => navigator.clipboard.writeText(value)}
                          className="p-2 text-text-muted hover:text-text hover:bg-line rounded-card transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 012-2h10a2 2 0 012 2v1M8 5v15" />
                          </svg>
                        </button>
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

            <div className="mt-4 flex justify-center">
              <Button variant="ghost" onClick={() => {
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
        </section>
        <PageFooter />
      </>
    );
  }

  return null;
}
