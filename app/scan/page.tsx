"use client";

import Link from "next/link";
import { useState, useCallback, useEffect, useRef, ReactNode } from "react";
import { 
  ArrowLeft, 
  ChevronRight, 
  Check, 
  CheckCircle2, 
  Copy, 
  RotateCcw, 
  MessageSquareQuote, 
  ShieldAlert, 
  FileText 
} from "lucide-react";
import { ImageCapture } from "@/components/ImageCapture";
import { AudioRecorder } from "@/components/AudioRecorder";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
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
    <Link href={href} className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-card border border-line bg-paper-card text-text font-semibold font-body hover:border-line-strong hover:bg-paper hover:shadow-sm transition-all">
      <ArrowLeft className="w-4 h-4" />
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
  const [copiedFieldId, setCopiedFieldId] = useState<string | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);
  const skippedFieldsRef = useRef<Set<string>>(new Set());
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

  useEffect(() => {
    skippedFieldsRef.current = new Set();
  }, [formSchema]);

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
    if (!formSchema || !currentFieldId) return;
    setError(null);
    // ponytail: sentinels are local-only, never stored; every skipped field is
    // remembered so getNextQuestion keeps moving past them instead of looping.
    skippedFieldsRef.current.add(currentFieldId);
    const nextAnswers = { ...answers };
    skippedFieldsRef.current.forEach(id => { nextAnswers[id] = "__skip__"; });
    const nextQ = await getNextQuestion(formSchema.fields, nextAnswers);
    if (nextQ.nextField) {
      setCurrentFieldId(nextQ.nextField);
      setCurrentQuestion(nextQ.questionUrdu);
      setStep("interview");
    } else {
      setStep("fields");
    }
  }, [formSchema, answers, currentFieldId]);

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
                className="inline-flex items-center gap-2 px-4 py-2 rounded-card border border-line bg-paper-card text-text font-semibold font-body hover:border-line-strong hover:bg-paper hover:shadow-sm transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Capture
              </button>
            </div>
            <div className="section-head" style={{textAlign:"center"}}>
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
                        <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
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
                <div className="w-20 h-20 mx-auto mb-6 rounded-card bg-jade/10 text-jade flex items-center justify-center border border-jade/20 shadow-sm">
                  <MessageSquareQuote className="w-10 h-10" />
                </div>
                <h2 
                  className="text-2xl sm:text-3xl font-bold font-urdu text-text mb-3 leading-relaxed"
                  dir="auto"
                >
                  {field?.questionUrdu || currentQuestion || field?.label}
                </h2>
                <div className="mt-3 flex justify-center">
                  <TTSButton text={field?.questionUrdu || currentQuestion || ""} />
                </div>
                {field?.questionEnglish && (
                  <p className="mt-3 text-text-muted font-body text-sm sm:text-base max-w-md mx-auto">{field.questionEnglish}</p>
                )}
              </CardContent>
            </Card>

          <Card variant="elevated" className="mt-4">
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
                <label className="block text-sm font-medium text-text mb-2 font-body">Or type your answer:</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-card border border-line bg-paper-card text-text placeholder-text-muted/70 focus:border-jade focus:ring-2 focus:ring-jade/20 focus:outline-none transition-all font-body text-base"
                  placeholder="Answer in Urdu (اردو) or English..."
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
                <p className="flex items-center gap-2 text-sm font-medium text-jade font-body" role="status">
                  <Check className="w-4 h-4 stroke-[2.5]" />
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
                <p className="text-sm text-jade font-medium break-words font-body">
                  Answer: <span className="font-semibold">{answers[currentFieldId]}</span>
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" onClick={() => setStep("fields")}>
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

            {/* Accessible Focus-Trapping Confirmation Modal */}
            <ConfirmationDialog
              isOpen={!!showConfirmation}
              fieldId={showConfirmation?.fieldId || ""}
              value={showConfirmation?.value || ""}
              questionUrdu={showConfirmation?.questionUrdu || ""}
              title="Confirm Important Information"
              onClose={() => handleConfirm(false)}
              onConfirm={() => handleConfirm(true)}
            />
          </div>
        </section>
        <PageFooter />
      </>
    );
  }

  if (step === "complete") {
    const handleCopyField = (fieldId: string, val: string) => {
      navigator.clipboard.writeText(val);
      setCopiedFieldId(fieldId);
      setTimeout(() => setCopiedFieldId(null), 2000);
    };

    const handleCopyJson = () => {
      const json = JSON.stringify(answers, null, 2);
      navigator.clipboard.writeText(json);
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    };

    return (
      <>
        <PageHeader />
        <section className="section">
          <div className="wrap" style={{maxWidth:960}}>
            <PageBackLink href="/">Back to home</PageBackLink>
            <div className="section-head" style={{textAlign:"center",marginBottom:32}}>
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-jade/10 text-jade flex items-center justify-center border border-jade/20 shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
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
                    const isCopied = copiedFieldId === fieldId;
                    return (
                      <div key={fieldId} className="flex items-start justify-between p-4 bg-paper rounded-card border border-line/50">
                        <div className="flex-1 pr-4">
                          <p className="text-sm text-text-muted font-body">{field.label}</p>
                          <p className="font-medium text-text font-body" style={{wordBreak:"break-all"}}>{value}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <TTSButton text={value} />
                          <button
                            onClick={() => handleCopyField(fieldId, value)}
                            className="p-2 text-text-muted hover:text-text hover:bg-line rounded-card transition-colors"
                            title={isCopied ? "Copied!" : "Copy value"}
                            aria-label={`Copy ${field.label}`}
                          >
                            {isCopied ? (
                              <Check className="w-4 h-4 text-jade stroke-[2.5]" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
                <CardFooter>
                  <Button size="lg" className="w-full" onClick={handleCopyJson}>
                    {copiedJson ? (
                      <>
                        <Check className="w-5 h-5 text-paper stroke-[2.5]" />
                        JSON Copied to Clipboard!
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        Copy All as JSON
                      </>
                    )}
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
                <RotateCcw className="w-4 h-4" />
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
