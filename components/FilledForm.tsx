"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FileText } from "lucide-react";
import { Button } from "@/components/Button";
import { canvasToPdfBytes, canvasToPngBlob, downloadBlob, renderFilledForm } from "@/lib/fill-form";
import type { FormTemplate } from "@/lib/types";

type Props = {
  template: FormTemplate;
  answers: Record<string, string | null | undefined>;
  showBoxes?: boolean;
  filename?: string;
};

// The template's page image with the answers drawn into its boxes, plus PNG and
// PDF download. Callers pass real answers only (no skip sentinels).
export function FilledForm({ template, answers, showBoxes = false, filename = "awaaz-filled-form" }: Props) {
  const previewRef = useRef<HTMLCanvasElement>(null);
  const [busy, setBusy] = useState<"png" | "pdf" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Callers often build a fresh answers object each render; key on content so
  // the canvas only redraws when an answer actually changes.
  const answersKey = JSON.stringify(answers);

  // Redraw whenever an answer changes; the latest render wins.
  useEffect(() => {
    let cancelled = false;
    renderFilledForm(template, JSON.parse(answersKey), { showBoxes })
      .then((canvas) => {
        const target = previewRef.current;
        if (cancelled || !target) return;
        target.width = canvas.width;
        target.height = canvas.height;
        target.getContext("2d")?.drawImage(canvas, 0, 0);
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "Could not draw the form."));
    return () => {
      cancelled = true;
    };
  }, [template, answersKey, showBoxes]);

  const exportAs = async (kind: "png" | "pdf") => {
    setBusy(kind);
    setError(null);
    try {
      // Export is always clean: never ship the alignment boxes.
      const canvas = await renderFilledForm(template, answers);
      if (kind === "png") {
        downloadBlob(await canvasToPngBlob(canvas), `${filename}.png`);
      } else {
        const bytes = await canvasToPdfBytes(canvas);
        downloadBlob(new Blob([bytes], { type: "application/pdf" }), `${filename}.pdf`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Button variant="jade" loading={busy === "png"} onClick={() => exportAs("png")}>
          <Download className="w-4 h-4" /> PNG
        </Button>
        <Button variant="marigold" loading={busy === "pdf"} onClick={() => exportAs("pdf")}>
          <FileText className="w-4 h-4" /> PDF
        </Button>
      </div>
      <p className="text-xs text-text-muted font-body">Print at 100% / actual size so the boxes line up with the paper.</p>
      {error && <p className="text-sm text-rani font-body" role="alert">{error}</p>}
      <canvas
        ref={previewRef}
        className="w-full h-auto rounded-card border border-line bg-white"
        aria-label="Preview of the filled form"
      />
    </div>
  );
}
