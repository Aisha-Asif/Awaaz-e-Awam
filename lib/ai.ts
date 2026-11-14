// Provider router: re-exports the extraction and speech-to-text functions behind the DATA_PATH
// guard (lib/provider.ts). The guard blocks training providers on the sensitive path — for both
// text extraction and audio STT — so real PII can never leave through either.
import { getExtractionProvider, getSttProvider } from "@/lib/provider";

export const extractFormSchema = (imageDataUrl: string) => getExtractionProvider().extractFormSchema(imageDataUrl);

export const extractAnswer = (
  fieldId: string,
  fieldType: string,
  label: string,
  questionUrdu: string,
  transcript: string,
) => getExtractionProvider().extractAnswer(fieldId, fieldType, label, questionUrdu, transcript);

export const extractSpeech = (transcript: string, schemaLabel: string, fieldIds: string[]) =>
  getExtractionProvider().extractSpeech(transcript, schemaLabel, fieldIds);

export const transcribeAudio = (mimeType: string, data: Buffer) => getSttProvider().transcribeAudio(mimeType, data);
