"use client";

// ResultList: the final answers, grouped by form section, each row showing the English and Urdu label, the value as it
// is written on paper (or "Not answered" / "Skipped"), and Listen / Copy buttons. Footer buttons copy everything as
// text or as JSON. Used by both the Speak and Scan result screens.
import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/Button";
import { TTSButton } from "@/components/TTS";
import { buildResultSections, resultsToJson, resultsToText, summarizeResults } from "@/lib/results";
import type { FormField } from "@/lib/types";

type Props = {
  fields: FormField[];
  answers: Record<string, string | null | undefined>;
};

// Which copy action was just used, so its button can show a tick for a moment.
type Copied = { kind: "field"; id: string } | { kind: "text" } | { kind: "json" } | null;

export function ResultList({ fields, answers }: Props) {
  const [copied, setCopied] = useState<Copied>(null);

  // Rebuild only when the form or the answers change.
  const answersKey = JSON.stringify(answers);
  const sections = useMemo(() => buildResultSections(fields, JSON.parse(answersKey)), [fields, answersKey]);
  const summary = summarizeResults(sections);

  // Copies text to the clipboard and shows the tick for two seconds.
  const copy = async (text: string, mark: Copied) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(mark);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Clipboard can be blocked (insecure page or denied permission); nothing else to do.
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-text-muted font-body" role="status">
        {summary.answered} of {summary.total} answered
        {summary.missingRequired > 0 ? ` · ${summary.missingRequired} required still missing` : ""}
      </p>

      {sections.map((section) => (
        <div key={section.name}>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted font-body mb-2">
            {section.name}
          </h4>
          <div className="space-y-2">
            {section.rows.map((row) => {
              const isCopied = copied?.kind === "field" && copied.id === row.id;
              return (
                <div
                  key={row.id}
                  className="flex items-start justify-between gap-3 p-3.5 bg-paper rounded-card border border-line/50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-muted font-body">
                      {row.label}
                      {row.required && <span className="text-rani"> *</span>}
                    </p>
                    {row.labelUr && (
                      <p className="text-sm text-text-muted font-urdu" dir="rtl">
                        {row.labelUr}
                      </p>
                    )}
                    {row.status === "answered" ? (
                      <p className="font-medium text-text font-body mt-0.5" style={{ wordBreak: "break-all" }}>
                        {row.display}
                      </p>
                    ) : (
                      <p className={`text-sm mt-0.5 font-body ${row.required ? "text-rani" : "text-text-muted"}`}>
                        {row.status === "skipped" ? "Skipped" : "Not answered"}
                      </p>
                    )}
                  </div>
                  {row.status === "answered" && row.display && (
                    <div className="flex items-center gap-1 shrink-0">
                      <TTSButton text={row.display} />
                      <button
                        type="button"
                        onClick={() => copy(row.display ?? "", { kind: "field", id: row.id })}
                        className="p-2 text-text-muted hover:text-text hover:bg-line rounded-card transition-colors"
                        title={isCopied ? "Copied!" : "Copy value"}
                        aria-label={`Copy ${row.label}`}
                      >
                        {isCopied ? <Check className="w-4 h-4 text-jade stroke-[2.5]" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex flex-col sm:flex-row gap-3">
        <Button className="flex-1" onClick={() => copy(resultsToText(sections), { kind: "text" })}>
          {copied?.kind === "text" ? (
            <>
              <Check className="w-5 h-5 stroke-[2.5]" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-5 h-5" />
              Copy all as text
            </>
          )}
        </Button>
        <Button
          variant="secondary"
          className="flex-1"
          onClick={() => copy(JSON.stringify(resultsToJson(sections), null, 2), { kind: "json" })}
        >
          {copied?.kind === "json" ? (
            <>
              <Check className="w-5 h-5 text-jade stroke-[2.5]" />
              JSON copied!
            </>
          ) : (
            <>
              <Copy className="w-5 h-5" />
              Copy as JSON
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
