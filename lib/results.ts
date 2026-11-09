// Result model: turns a form's fields plus the collected answers into labelled, section-grouped rows for the
// final screen and for copy/export. Pure logic (no React, no browser APIs) so it is easy to test.
import type { FormField, PrintFormat } from "@/lib/types";
import { SKIP_SENTINEL } from "@/lib/schemas";
import { formatForPaper } from "@/lib/fill-form";
import { printFormatOf } from "@/lib/field-model";

// answered = has a value; skipped = the user chose to skip it; empty = never answered.
export type ResultStatus = "answered" | "skipped" | "empty";

export type ResultRow = {
  id: string;
  label: string;
  labelUr?: string;
  required: boolean;
  status: ResultStatus;
  // The stored value (e.g. 13 plain CNIC digits), or null when not answered.
  raw: string | null;
  // The value as written on paper (e.g. 35202-1234567-1), or null when not answered.
  display: string | null;
  printFormat: PrintFormat;
};

export type ResultSection = { name: string; rows: ResultRow[] };

export type ResultSummary = { total: number; answered: number; missingRequired: number };

// Fields with no section land here.
const DEFAULT_SECTION = "Details";

// Groups every field of the form into sections (in first-seen order) with a status and a paper-style value.
export function buildResultSections(
  fields: FormField[],
  answers: Record<string, string | null | undefined>,
): ResultSection[] {
  const sections: ResultSection[] = [];

  for (const field of fields) {
    const name = field.section?.trim() || DEFAULT_SECTION;
    let section = sections.find((s) => s.name === name);
    if (!section) {
      section = { name, rows: [] };
      sections.push(section);
    }

    const value = answers[field.id];
    const trimmed = typeof value === "string" ? value.trim() : "";
    const status: ResultStatus = value === SKIP_SENTINEL ? "skipped" : trimmed ? "answered" : "empty";
    const printFormat = printFormatOf(field);

    section.rows.push({
      id: field.id,
      label: field.label,
      labelUr: field.labelUr,
      required: field.required,
      status,
      raw: status === "answered" ? trimmed : null,
      display: status === "answered" ? formatForPaper(field.type, trimmed, printFormat) : null,
      printFormat,
    });
  }

  return sections;
}

// Counts for the "N of M answered" line.
export function summarizeResults(sections: ResultSection[]): ResultSummary {
  const rows = sections.flatMap((s) => s.rows);
  return {
    total: rows.length,
    answered: rows.filter((r) => r.status === "answered").length,
    missingRequired: rows.filter((r) => r.required && r.status !== "answered").length,
  };
}

// Plain-text version for copying: a heading per section, then "Label: value" lines, unanswered rows marked.
export function resultsToText(sections: ResultSection[]): string {
  return sections
    .map((section) => {
      const lines = section.rows.map((r) => {
        const shown = r.status === "answered" ? r.display : r.status === "skipped" ? "(skipped)" : "(not answered)";
        return `${r.label}: ${shown}`;
      });
      return [section.name, ...lines].join("\n");
    })
    .join("\n\n");
}

// JSON version for copying: only answered fields, keyed by field id, with the stored (not paper-styled) value.
export function resultsToJson(sections: ResultSection[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const row of sections.flatMap((s) => s.rows)) {
    if (row.status === "answered" && row.raw !== null) out[row.id] = row.raw;
  }
  return out;
}
