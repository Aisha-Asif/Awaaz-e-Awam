"use client";

// FormNotices: messages about a form that belong in the app, never on the printed form.
//   intro  -> before filling: the form's notes and the areas the app leaves blank (signatures, thumb, stamps, office use)
//   result -> after filling: a warning for any required field still empty, and the same "leave blank" reminder
import { AlertTriangle, Info, PenLine } from "lucide-react";
import { buildResultSections } from "@/lib/results";
import type { FormTemplate } from "@/lib/types";

type Props = {
  template: FormTemplate;
  variant: "intro" | "result";
  answers?: Record<string, string | null | undefined>;
};

export function FormNotices({ template, variant, answers = {} }: Props) {
  const rows = buildResultSections(template.schema.fields, answers).flatMap((s) => s.rows);
  const missing = rows.filter((r) => r.required && r.status !== "answered");
  const notes = template.notes ?? [];
  const leaveBlank = template.leaveBlank ?? [];

  return (
    <div className="space-y-3 mb-5">
      {variant === "result" && missing.length > 0 && (
        <div className="p-3.5 rounded-xl bg-rani/10 border border-rani/30 text-sm text-text font-body" role="alert">
          <p className="flex items-center gap-2 font-semibold text-rani">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {missing.length} required {missing.length === 1 ? "field is" : "fields are"} still empty
          </p>
          <p className="mt-1 text-text-muted">{missing.map((r) => r.label).join(", ")}. They will print blank.</p>
        </div>
      )}

      {variant === "intro" && notes.length > 0 && (
        <div className="p-3.5 rounded-xl bg-paper-subtle border border-line text-sm text-text-muted font-body">
          <p className="flex items-center gap-2 font-semibold text-text">
            <Info className="w-4 h-4 shrink-0" />
            Before you start
          </p>
          <ul className="mt-1 list-disc pl-5 space-y-0.5">
            {notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      )}

      {variant === "result" && (
        <p className="text-xs text-text-muted font-body">
          This app does not submit anything to NADRA or any office. Check the printout against the official form before
          using it.
        </p>
      )}

      {leaveBlank.length > 0 && (
        <div className="p-3.5 rounded-xl bg-marigold/10 border border-marigold/30 text-sm text-text-muted font-body">
          <p className="flex items-center gap-2 font-semibold text-text">
            <PenLine className="w-4 h-4 shrink-0 text-marigold" />
            Left blank on purpose: complete these by hand
          </p>
          <ul className="mt-1 list-disc pl-5 space-y-0.5">
            {leaveBlank.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs">This list is only shown here. Nothing is written on the form about it.</p>
        </div>
      )}
    </div>
  );
}
