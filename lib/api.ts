import {
  FormSchema,
  ProcessAnswerResponse,
  NextQuestionResponse,
  ProcessSpeechResponse
} from "@/lib/types";
import {
  MOCK_FORM_SCHEMA,
  getMockProcessAnswerResponse,
  getMockNextQuestion,
  getMockProcessSpeechResponse
} from "@/lib/mock-data";

const USE_MOCK = true;

async function mockDelay(ms: number = 500) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function scanForm(imageFile: File): Promise<FormSchema> {
  if (USE_MOCK) {
    await mockDelay(1000);
    return MOCK_FORM_SCHEMA;
  }

  const formData = new FormData();
  formData.append("image", imageFile);

  const response = await fetch("/api/scan-form", {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to scan form");
  }

  return response.json();
}

export async function processAnswer(
  fieldId: string,
  fieldType: string,
  transcript: string
): Promise<ProcessAnswerResponse> {
  if (USE_MOCK) {
    await mockDelay(300);
    return getMockProcessAnswerResponse(fieldId, transcript);
  }

  const response = await fetch("/api/process-answer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fieldId, fieldType, transcript })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to process answer");
  }

  return response.json();
}

export async function getNextQuestion(
  fields: FormSchema["fields"],
  answers: Record<string, string | null>
): Promise<NextQuestionResponse> {
  if (USE_MOCK) {
    await mockDelay(200);
    return getMockNextQuestion(fields, answers);
  }

  const response = await fetch("/api/next-question", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields, answers })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to get next question");
  }

  return response.json();
}

export async function processSpeech(audioFile: File): Promise<ProcessSpeechResponse> {
  if (USE_MOCK) {
    await mockDelay(1500);
    return getMockProcessSpeechResponse("Mera naam Ali Raza hai. Mere walid ka naam Ahmed Raza hai. Main Lahore mein rehta hoon.");
  }

  const formData = new FormData();
  formData.append("audio", audioFile);
  formData.append("formType", "citizen");

  const response = await fetch("/api/process-speech", {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to process speech");
  }

  return response.json();
}