"use client";

import Link from "next/link";
import { useState, useCallback, useEffect, ReactNode } from "react";
import { ImageCapture } from "@/components/ImageCapture";
import { AudioRecorder } from "@/components/AudioRecorder";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/Card";
import { Button } from "@/components/Button";
import { Progress } from "@/components/Progress";
import { TTSButton } from "@/components/TTS";
import { useSpeechRecognition } from "@/components/useSpeechRecognition";
import { scanForm, getNextQuestion, processAnswer, transcribeAudioFile } from "@/lib/api";
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

// ponytail: form history lives in localStorage only (schemas are JSON-safe,
// MVP has no DB). Capped at 10, deduped by formTitle. Upgrading this to a
// shared/backend store is the point where Supabase earns its place.
const HISTORY_KEY = "awaaz:formHistory";
const HISTORY_MAX = 10;

function getFormHistory(): FormSchema[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveFormHistory(list: FormSchema[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, HISTORY_MAX)));
  } catch {
    // ignore quota/private-mode failures; history is best-effort
  }
}

function addToFormHistory(current: FormSchema[], schema: FormSchema): FormSchema[] {
  const deduped = current.filter(s => s.formTitle !== schema.formTitle);
  return [schema, ...deduped].slice(0, HISTORY_MAX);
}

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

// ponytail: shared back link slot — placed at the top-left of each section.
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
  const [formHistory, setFormHistory] = useState<FormSchema[]>(getFormHistory);
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
    if (step === "capture") return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [step]);

  const handleImageCapture = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const url = URL.createObjectURL(file);
      setOriginalImage(url);
      const schema = await scanForm(file);
      setFormSchema(schema);

      setFormHistory(prev => {
        const next = addToFormHistory(prev, schema);
        saveFormHistory(next);
        return next;
      });

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

  // Advance to the next unanswered field without recording the current one.
  const skipCurrentField = useCallback(async () => {
    if (!formSchema) return;
    setError(null);
    const nextQ = await getNextQuestion(formSchema.fields, answers);
    if (nextQ.nextField) {
      setCurrentFieldId(nextQ.nextField);
      setCurrentQuestion(nextQ.questionUrdu);
      setStep("interview");
    } else {
      setStep("complete");
    }
  }, [formSchema, answers]);

  const getFilledCount = () => Object.values(answers).filter(v => v !== null).length;
  const getRequiredCount = () => formSchema?.fields.filter(f => f.required).length || 0;

  const handleSelectHistory = useCallback((schema: FormSchema) => {
    setFormSchema(schema);
    const initialAnswers: Record<string, string | null> = {};
    schema.fields.forEach(f => { initialAnswers[f.id] = null; });
    setAnswers(initialAnswers);
    setCurrentFieldId(null);
    setCurrentQuestion(null);
    setOriginalImage(null);
    setStep("fields");
  }, []);

  // Let the user jump straight into the interview for any detected field.
  const handleFieldSelect = useCallback((fieldId: string) => {
    setCurrentFieldId(fieldId);
    const field = formSchema?.fields.find(f => f.id === fieldId);
    setCurrentQuestion(field?.questionUrdu ?? null);
    setStep("interview");
  }, [formSchema]);

  const handleClearHistory = useCallback(() => {
    setFormHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      // ignore
    }
  }, []);

  if (step === "capture") {
    return (
      <>
        <PageHeader />
        <section className="section">
          <div className="wrap" style={{maxWidth:720}}>
            <PageBackLink href="/">Back to home</PageBackLink>
            <div className="section-head" style={{textAlign:"center",marginBottom:32}}>
              <h2>Scan a Form</h2>
              <p>Take a clear photo of your physical form or upload an image. The AI will identify all fields.</p>
            </div>

            <Card variant="elevated" padding="lg">
              <CardContent>
                <ImageCapture
                  onImageCapture={handleImageCapture}
                  disabled={loading}
                />
              </CardContent>
            </Card>

            {error && (
              <div className="p-4 bg-rani/10 border border-rani/30 rounded-card text-rani text-center font-body mt-4" role="alert">
                {error}
              </div>
            )}

            {formHistory.length > 0 && (
              <Card variant="elevated" padding="lg" className="mt-4">
                <CardHeader>
                  <CardTitle>Previously Scanned</CardTitle>
                  <CardDescription>Pick a saved form to skip re-scanning</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {formHistory.map(schema => (
                    <div key={schema.formTitle} className="flex items-center justify-between p-3 bg-paper rounded-card">
                      <div className="flex-1 pr-2">
                        <p className="font-medium text-text font-body">{schema.formTitle}</p>
                        <p className="text-sm text-text-muted font-body">{schema.fields.length} fields</p>
                      </div>
                      <Button variant="primary" size="sm" onClick={() => handleSelectHistory(schema)}>
                        Use
                      </Button>
                    </div>
                  ))}
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" size="sm" onClick={handleClearHistory}>
                    Clear History
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        </section>
        <PageFooter />
      </>
    );
  }

  if (step === "fields") {
    return (
      <>
        <PageHeader />
        <section className="section">
          <div className="wrap" style={{maxWidth:720}}>
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setStep("capture")}
                className="inline-flex items-center gap-2 font-body text-text-muted hover:text-text transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Capture
              </button>
            </div>
            <div className="section-head">
              <h2>Detected Fields</h2>
              <p>{formSchema?.formTitle} — {formSchema?.fields.length} fields detected</p>
            </div>

            {formSchema && (
              <Card variant="elevated" padding="lg">
                <CardContent className="space-y-3">
                  {formSchema.fields.map(field => (
                    <div key={field.id} className="flex items-center justify-between p-3 bg-paper rounded-card">
                      <button
                        type="button"
                        onClick={() => handleFieldSelect(field.id)}
                        className="flex-1 min-w-0 text-left flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${field.required ? "bg-rani" : "bg-line"}`} />
                        <span className="min-w-0">
                          <span className="block font-medium text-text font-body">{field.label}</span>
                          <span className="block text-sm text-text-muted font-body">{field.type} {field.required ? "• Required" : "• Optional"}</span>
                        </span>
                        {answers[field.id] && (
                          <span className="ml-auto text-jade font-medium text-sm truncate max-w-[10rem]">{answers[field.id]}</span>
                        )}
                        <svg className="w-4 h-4 text-text-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      <TTSButton text={field.questionUrdu} className="ml-2 shrink-0" />
                    </div>
                  ))}
                </CardContent>
                <CardFooter>
                  <Button size="lg" className="w-full" onClick={startInterview} disabled={loading}>
                    {loading ? "Starting..." : "Start Voice Interview (in order)"}
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        </section>
        <PageFooter />
      </>
    );
  }

  if (step === "interview") {
    const field = formSchema?.fields.find(f => f.id === currentFieldId);
    const progress = getFilledCount();
    const total = getRequiredCount();

    return (
      <>
        <PageHeader />
        <section className="section">
          <div className="wrap" style={{maxWidth:640}}>
            <PageBackLink href="/">Back to home</PageBackLink>
            <div className="mb-6">
              <Progress value={progress} max={total} showLabel label="Interview Progress" size="lg" />
            </div>

            <Card variant="elevated" padding="lg">
              <CardContent className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-6 rounded-card bg-jade/10 flex items-center justify-center">
                  <svg className="w-10 h-10 text-jade" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          <Card variant="elevated">
            <CardContent className="pt-0 space-y-4">
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
              {justSaved && (
                <p className="flex items-center gap-2 text-sm font-medium text-jade" role="status">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Answer saved
                </p>
              )}
              {srSupported && (
                <div>
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
                <div className="p-3 bg-rani/10 border border-rani/30 rounded-card text-rani text-sm text-center font-body" role="alert">
                  {srError}
                </div>
              )}
              {currentFieldId && answers[currentFieldId] && (
                <p className="text-sm text-jade font-medium break-words">
                  Answer: <span className="font-body">{answers[currentFieldId]}</span>
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => setStep("fields")}>
                  Back to Fields
                </Button>
                <Button variant="ghost" onClick={skipCurrentField} disabled={loading}>
                  Skip this field for now
                </Button>
              </div>
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
          <div className="wrap" style={{maxWidth:960}}>
            <PageBackLink href="/">Back to home</PageBackLink>
            <div className="section-head" style={{textAlign:"center",marginBottom:32}}>
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-jade/10 flex items-center justify-center">
                <svg className="w-10 h-10 text-jade" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2>Interview Complete!</h2>
              <p>All required fields have been answered.</p>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
              <Card variant="elevated" padding="lg">
                <CardHeader>
                  <CardTitle>Your Answers</CardTitle>
                  <CardDescription>Copy these to your physical form</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4" style={{maxHeight:"60vh",overflowY:"auto"}}>
                  {REQUIRED_FIELD_ORDER.map(fieldId => {
                    const value = answers[fieldId];
                    const field = formSchema?.fields.find(f => f.id === fieldId);
                    if (!field || !value) return null;
                    return (
                      <div key={fieldId} className="flex items-start justify-between p-4 bg-paper rounded-card">
                        <div className="flex-1 pr-4">
                          <p className="text-sm text-text-muted font-body">{field.label}</p>
                          <p className="font-medium text-text font-body" style={{wordBreak:"break-all"}}>{value}</p>
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

              <Card variant="elevated" padding="lg">
                <CardHeader>
                  <CardTitle>Original Form</CardTitle>
                  <CardDescription>Reference for where to write each answer</CardDescription>
                </CardHeader>
                <CardContent>
                  {originalImage && (
                    <div className="relative bg-line rounded-card overflow-hidden" style={{aspectRatio:"4/3"}}>
                      <img
                        src={originalImage}
                        alt="Original form"
                        className="w-full h-full object-contain p-4"
                      />
                    </div>
                  )}
                  {!originalImage && (
                    <div className="bg-line rounded-card flex items-center justify-center" style={{aspectRatio:"4/3"}}>
                      <p className="text-text-muted font-body">Form image not available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 flex justify-center">
              <Button variant="ghost" onClick={() => {
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
        </section>
        <PageFooter />
      </>
    );
  }

  return null;
}
