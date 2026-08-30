import { FormSchema, FormField, ProcessAnswerResponse, NextQuestionResponse, ProcessSpeechResponse } from "@/lib/types";

export const MOCK_FORM_SCHEMA: FormSchema = {
  formTitle: "Citizen Information Form",
  fields: [
    {
      id: "fullName",
      label: "Full Name",
      type: "text",
      required: true,
      questionUrdu: "Aap ka poora naam kya hai?",
      questionEnglish: "What is your full name?"
    },
    {
      id: "fatherName",
      label: "Father's Name",
      type: "text",
      required: true,
      questionUrdu: "Aap ke walid ka naam kya hai?",
      questionEnglish: "What is your father's name?"
    },
    {
      id: "cnic",
      label: "CNIC",
      type: "cnic",
      required: true,
      questionUrdu: "Aap ka CNIC number kya hai?",
      questionEnglish: "What is your CNIC number?"
    },
    {
      id: "dateOfBirth",
      label: "Date of Birth",
      type: "date",
      required: true,
      questionUrdu: "Aap ki tareekh paidaish kya hai?",
      questionEnglish: "What is your date of birth?"
    },
    {
      id: "gender",
      label: "Gender",
      type: "select",
      required: false,
      questionUrdu: "Aap ka jins kya hai?",
      questionEnglish: "What is your gender?"
    },
    {
      id: "phone",
      label: "Mobile Number",
      type: "phone",
      required: true,
      questionUrdu: "Aap ka mobile number kya hai?",
      questionEnglish: "What is your mobile number?"
    },
    {
      id: "address",
      label: "Address",
      type: "address",
      required: false,
      questionUrdu: "Aap ka pata kya hai?",
      questionEnglish: "What is your address?"
    },
    {
      id: "city",
      label: "City",
      type: "text",
      required: true,
      questionUrdu: "Aap ka sheher kya hai?",
      questionEnglish: "What is your city?"
    },
    {
      id: "district",
      label: "District",
      type: "text",
      required: false,
      questionUrdu: "Aap ka zila kya hai?",
      questionEnglish: "What is your district?"
    }
  ]
};

export const REQUIRED_FIELD_ORDER = [
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

export function getMockProcessAnswerResponse(
  fieldId: string,
  transcript: string
): ProcessAnswerResponse {
  const field = MOCK_FORM_SCHEMA.fields.find(f => f.id === fieldId);
  if (!field) {
    return {
      fieldId,
      value: null,
      valid: false,
      needsConfirmation: false,
      error: "Field not found"
    };
  }

  const lowerTranscript = transcript.toLowerCase();

  if (fieldId === "cnic") {
    const cnicMatch = transcript.match(/(\d{5}[-\s]?\d{7}[-\s]?\d{1})|(\d{13})/);
    if (cnicMatch) {
      const normalized = cnicMatch[0].replace(/[-\s]/g, "");
      return {
        fieldId,
        value: normalized,
        valid: normalized.length === 13,
        needsConfirmation: true,
        error: normalized.length === 13 ? null : "CNIC must contain 13 digits."
      };
    }
  }

  if (fieldId === "phone") {
    const phoneMatch = transcript.match(/(\+?92|0)?\s*3\d{2}[\s-]?\d{7}/);
    if (phoneMatch) {
      let normalized = phoneMatch[0].replace(/[\s-]/g, "");
      if (normalized.startsWith("92")) normalized = "0" + normalized.slice(2);
      if (!normalized.startsWith("0")) normalized = "0" + normalized;
      return {
        fieldId,
        value: normalized,
        valid: normalized.length >= 11,
        needsConfirmation: true,
        error: normalized.length >= 11 ? null : "Invalid phone number format."
      };
    }
  }

  if (fieldId === "dateOfBirth") {
    const dateMatch = transcript.match(/(\d{1,2})[\/\-\s](\d{1,2})[\/\-\s](\d{4})/);
    if (dateMatch) {
      const [_, day, month, year] = dateMatch;
      const normalized = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      return {
        fieldId,
        value: normalized,
        valid: true,
        needsConfirmation: true,
        error: null
      };
    }
  }

  if (fieldId === "fullName" || fieldId === "fatherName" || fieldId === "city" || fieldId === "district" || fieldId === "address") {
    const words = transcript.trim().split(/\s+/);
    if (words.length > 0) {
      const value = transcript.trim();
      return {
        fieldId,
        value,
        valid: value.length > 0,
        needsConfirmation: false,
        error: null
      };
    }
  }

  if (fieldId === "gender") {
    const genderMap: Record<string, string> = {
      "male": "Male",
      "mard": "Male",
      "female": "Female",
      "aurat": "Female",
      "larki": "Female",
      "ladka": "Male"
    };
    for (const [key, value] of Object.entries(genderMap)) {
      if (lowerTranscript.includes(key)) {
        return {
          fieldId,
          value,
          valid: true,
          needsConfirmation: false,
          error: null
        };
      }
    }
  }

  return {
    fieldId,
    value: transcript.trim() || null,
    valid: transcript.trim().length > 0,
    needsConfirmation: false,
    error: transcript.trim().length > 0 ? null : "Please provide an answer."
  };
}

export function getMockNextQuestion(
  fields: FormField[],
  answers: Record<string, string | null>
): NextQuestionResponse {
  for (const fieldId of REQUIRED_FIELD_ORDER) {
    const field = fields.find(f => f.id === fieldId);
    if (field && field.required && !answers[fieldId]) {
      return {
        nextField: fieldId,
        questionUrdu: field.questionUrdu,
        complete: false
      };
    }
  }

  for (const field of fields) {
    if (!field.required && !answers[field.id]) {
      return {
        nextField: field.id,
        questionUrdu: field.questionUrdu,
        complete: false
      };
    }
  }

  return {
    nextField: null,
    questionUrdu: null,
    complete: true
  };
}

export function getMockProcessSpeechResponse(transcript: string): ProcessSpeechResponse {
  const extracted: Record<string, string | null> = {};

  for (const field of MOCK_FORM_SCHEMA.fields) {
    const response = getMockProcessAnswerResponse(field.id, transcript);
    extracted[field.id] = response.value;
  }

  const missingFields = REQUIRED_FIELD_ORDER.filter(id => !extracted[id]);
  const invalidFields = MOCK_FORM_SCHEMA.fields
    .filter(f => extracted[f.id] && !getMockProcessAnswerResponse(f.id, transcript).valid)
    .map(f => ({ fieldId: f.id, message: getMockProcessAnswerResponse(f.id, transcript).error || "Invalid value" }));

  const followUpQuestion = missingFields.length > 0
    ? MOCK_FORM_SCHEMA.fields.find(f => f.id === missingFields[0])?.questionUrdu || null
    : null;

  return {
    transcript,
    extracted,
    validation: {
      valid: missingFields.length === 0 && invalidFields.length === 0,
      missingFields,
      invalidFields
    },
    followUpQuestion
  };
}