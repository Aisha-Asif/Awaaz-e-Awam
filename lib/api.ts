import { FormSchema, ProcessAnswerResponse, NextQuestionResponse, ProcessSpeechResponse } from "@/lib/types";

// ===== API Error Types =====

export type ApiError = {
  error: string;
};

// ===== API #1 — Scan Form =====

export async function scanForm(imageFile: File): Promise<FormSchema> {
  const formData = new FormData();
  formData.append("image", imageFile);

  const response = await fetch("/api/scan-form", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || "Failed to scan form");
  }

  return response.json();
}

// ===== API #2 — Process Answer =====

export async function processAnswer(
  fieldId: string,
  fieldType: string,
  transcript: string,
  label?: string,
  questionUrdu?: string,
): Promise<ProcessAnswerResponse> {
  const response = await fetch("/api/process-answer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fieldId, fieldType, transcript, label, questionUrdu }),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || "Failed to process answer");
  }

  return response.json();
}

// ===== API #3 — Next Question =====

export async function getNextQuestion(
  fields: FormSchema["fields"],
  answers: Record<string, string | null>,
): Promise<NextQuestionResponse> {
  const response = await fetch("/api/next-question", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields, answers }),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || "Failed to get next question");
  }

  return response.json();
}

// ===== Transcribe audio → text (Gemini STT) =====

export async function transcribeAudioFile(audioFile: Blob): Promise<string> {
  const formData = new FormData();
  formData.append("audio", audioFile);

  const response = await fetch("/api/transcribe", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || "Failed to transcribe audio");
  }

  const data = (await response.json()) as { transcript: string };
  return data.transcript;
}

// ===== API #4 — Process Speech =====

export async function processSpeech(audioFile: File, templateId?: string): Promise<ProcessSpeechResponse> {
  const formData = new FormData();
  formData.append("audio", audioFile);
  formData.append("formType", "citizen");
  if (templateId) formData.append("templateId", templateId);

  const response = await fetch("/api/process-speech", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || "Failed to process speech");
  }

  return response.json();
}
