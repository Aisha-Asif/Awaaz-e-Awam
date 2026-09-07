"use client";

import Link from "next/link";
import { useState, useCallback, useEffect, ReactNode } from "react";
import { 
  ArrowLeft, 
  ChevronRight, 
  Check, 
  CheckCircle2, 
  Copy, 
  RotateCcw, 
  MessageSquareQuote, 
  ShieldAlert,
  Loader2 
} from "lucide-react";
import { AudioRecorder } from "@/components/AudioRecorder";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/Card";
import { Button } from "@/components/Button";
import { Progress } from "@/components/Progress";
import { TTSButton } from "@/components/TTS";
import { useSpeechRecognition } from "@/components/useSpeechRecognition";
import { processSpeech, getNextQuestion, processAnswer, transcribeAudioFile } from "@/lib/api";
import { MOCK_FORM_SCHEMA } from "@/lib/mock-data";
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

export default function SpeakPage() {
  const [step, setStep] = useState<"record" | "review" | "interview" | "complete">("record");
  const [speechResponse, setSpeechResponse] = useState<ProcessSpeechResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [currentFieldId, setCurrentFieldId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [formSchema, setFormSchema] = useState<FormSchema | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState<{
    fieldId: string;
    value: string;
    questionUrdu: string;
  } | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [copiedFieldId, setCopiedFieldId] = useState<string | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);
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
        fields: MOCK_FORM_SCHEMA.fields
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

            {/* Live recording banner */}
            {isRecording && (
              <div className="mb-4 p-3.5 rounded-xl bg-rani/10 border border-rani/30 flex items-center justify-between text-rani text-sm animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rani opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rani"></span>
                  </span>
                  <span className="font-semibold font-body">Recording your details...</span>
                </div>
                <span className="font-urdu text-sm" dir="rtl">اپنا نام، ولدیت، شناختی کارڈ اور پتہ بولیں</span>
              </div>
            )}

            <Card variant="elevated" padding="lg">
              <CardContent>
                <AudioRecorder
                  onRecordingComplete={handleRecordingComplete}
                  onRecordingStateChange={setIsRecording}
                  disabled={loading}
                />
              </CardContent>
            </Card>

            {/* Processing Progress Bar */}
            {loading && (
              <div className="mt-4 p-5 rounded-card bg-jade/10 border border-jade/30 text-center animate-in fade-in duration-300">
                <div className="flex items-center justify-center gap-2 text-jade font-semibold font-body mb-1.5">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Analyzing speech & extracting form fields...</span>
                </div>
                <p className="text-sm text-text-muted font-urdu" dir="rtl">
                  آپ کی آواز سے معلومات حاصل کی جا رہی ہے...
                </p>
                <div className="mt-3.5 h-2 w-full max-w-xs mx-auto bg-paper rounded-full overflow-hidden border border-jade/30 p-0.5">
                  <div className="h-full bg-gradient-to-r from-marigold to-jade rounded-full animate-pulse w-3/4 mx-auto" />
                </div>
              </div>
            )}

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
            <Button variant="secondary" onClick={() => setStep("record")} className="mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to Recording
            </Button>
            <div className="section-head" style={{textAlign:"center"}}>
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

            <Card variant="elevated" padding="lg" className="mt-4">
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
            <Button variant="secondary" onClick={() => setStep("review")} className="mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to Review
            </Button>
            <div className="mb-6">
              <Progress value={progress} max={totalRequired} showLabel label="Interview Progress" size="lg" />
            </div>

            <Card variant="elevated" padding="lg">
              <CardContent className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-6 rounded-card bg-rani/10 text-rani flex items-center justify-center border border-rani/20 shadow-sm">
                  <MessageSquareQuote className="w-10 h-10" />
                </div>
                <h2 
                  className="text-2xl sm:text-3xl font-bold font-urdu text-text mb-3 leading-relaxed"
                  dir="auto"
                >
                  {field?.questionUrdu || currentQuestion || field?.label}
                </h2>
                <div className="mt-3 flex justify-center">
                  <TTSButton text={field?.questionUrdu || currentQuestion || field?.label || ""} />
                </div>
                {field?.questionEnglish && (
                  <p className="mt-3 text-text-muted font-body text-sm sm:text-base max-w-md mx-auto">{field.questionEnglish}</p>
                )}
              </CardContent>
            </Card>

            <Card variant="elevated" padding="lg" className="mt-4">
              <CardContent>
                <AudioRecorder
                  key={currentFieldId}
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
                  <p className="mt-3 text-sm text-jade font-medium break-words font-body">
                    Answer: <span className="font-semibold">{answers[currentFieldId]}</span>
                  </p>
                )}
                {justSaved && (
                  <p className="mt-3 flex items-center gap-2 text-sm font-medium text-jade font-body" role="status">
                    <Check className="w-4 h-4 stroke-[2.5]" />
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
          <div className="wrap" style={{maxWidth:720}}>
            <PageBackLink href="/">Back to home</PageBackLink>
            <div className="section-head" style={{textAlign:"center",marginBottom:32}}>
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-jade/10 text-jade flex items-center justify-center border border-jade/20 shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
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
                  const isCopied = copiedFieldId === fieldId;
                  return (
                    <div key={fieldId} className="flex items-center justify-between p-3.5 bg-paper rounded-card border border-line/50">
                      <div>
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

            <div className="mt-4 flex justify-center">
              <Button variant="ghost" onClick={() => {
                setStep("record");
                setSpeechResponse(null);
                setAnswers({});
                setCurrentFieldId(null);
                setCurrentQuestion(null);
              }}>
                <RotateCcw className="w-4 h-4" />
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
