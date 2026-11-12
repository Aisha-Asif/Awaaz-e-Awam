"use client";

// Calibration tool (development only): draw boxes on a form image for each field, then copy the exported JSON into the
// template file. Pick an image, paste or load the field list, choose what to draw (text area, mirror area or a tick box
// for an option), and drag on the image. Boxes are saved in page pixels, which is what the template files use.
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Copy, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/Card";
import { TEMPLATES } from "@/lib/templates";
import {
  MIN_BOX,
  applyRect,
  clearField,
  exportCalibration,
  rectFromDrag,
  toImagePoint,
  validateCalibration,
  type Calibration,
  type CalibrationField,
  type Point,
  type Target,
} from "@/lib/calibrate";
import type { RawRect } from "@/lib/templates";

const IMAGES = [
  "/templates/birth-registration.png",
  "/templates/citizen-confirmation.png",
  "/templates/marriage-registration.png",
  "/templates/nadra-attester-smartid.png",
];

const DEFAULT_FIELDS = `[
  { "id": "applicantName", "label": "Applicant's name", "required": true },
  { "id": "gender", "label": "Gender", "options": ["Male", "Female", "Transgender"] }
]`;

// Parses the field list text; returns the fields or an error message.
function parseFields(text: string): { fields: CalibrationField[]; error: string | null } {
  try {
    const data: unknown = JSON.parse(text);
    if (!Array.isArray(data)) return { fields: [], error: "The field list must be a JSON array." };
    const fields: CalibrationField[] = [];
    for (const item of data) {
      const f = item as Partial<CalibrationField>;
      if (!f || typeof f.id !== "string" || !f.id) return { fields: [], error: "Every field needs a string id." };
      fields.push({
        id: f.id,
        label: typeof f.label === "string" ? f.label : f.id,
        options: Array.isArray(f.options) ? f.options.map(String) : undefined,
        required: !!f.required,
      });
    }
    return { fields, error: null };
  } catch (e) {
    return { fields: [], error: e instanceof Error ? e.message : "Invalid JSON." };
  }
}

export default function CalibratePage() {
  const [imageUrl, setImageUrl] = useState(IMAGES[0]);
  const [natural, setNatural] = useState<{ width: number; height: number } | null>(null);
  const [fieldsText, setFieldsText] = useState(DEFAULT_FIELDS);
  const [calibration, setCalibration] = useState<Calibration>({});
  const [target, setTarget] = useState<Target | null>(null);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [dragNow, setDragNow] = useState<Point | null>(null);
  const [copied, setCopied] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const { fields, error } = useMemo(() => parseFields(fieldsText), [fieldsText]);
  const exported = useMemo(() => exportCalibration(calibration, fields), [calibration, fields]);
  const exportText = JSON.stringify(exported, null, 2);
  const problems = useMemo(
    () => (natural ? validateCalibration(calibration, fields, natural) : []),
    [calibration, fields, natural],
  );

  // The image can finish loading before React attaches its onLoad handler (server-rendered page, cached image), so
  // also read its size once it is mounted.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setNatural({ width: img.naturalWidth, height: img.naturalHeight });
    }
  }, [imageUrl]);

  // This tool is for building templates, so it is not shown in production builds.
  if (process.env.NODE_ENV === "production") {
    return <p className="wrap py-10 font-body">The calibration tool is only available while developing.</p>;
  }

  const pointFromEvent = (e: React.PointerEvent): Point | null => {
    const img = imgRef.current;
    if (!img || !natural) return null;
    return toImagePoint({ x: e.clientX, y: e.clientY }, img.getBoundingClientRect(), natural);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!target) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = pointFromEvent(e);
    setDragStart(p);
    setDragNow(p);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStart) setDragNow(pointFromEvent(e));
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const end = pointFromEvent(e);
    if (dragStart && end && target) {
      const rect = rectFromDrag(dragStart, end);
      if (rect.w >= MIN_BOX && rect.h >= MIN_BOX) setCalibration((c) => applyRect(c, target, rect));
    }
    setDragStart(null);
    setDragNow(null);
  };

  const loadTemplate = (id: string) => {
    const t = TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    setImageUrl(t.imageUrl);
    setFieldsText(
      JSON.stringify(
        t.schema.fields.map((f) => ({ id: f.id, label: f.label, options: f.options, required: f.required })),
        null,
        2,
      ),
    );
    setCalibration({});
    setTarget(null);
  };

  const copyExport = async () => {
    try {
      await navigator.clipboard.writeText(exportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the text is selectable in the box below.
    }
  };

  // Style for a rectangle drawn over the image, using percentages so it follows the image size.
  const overlay = (r: RawRect, color: string, thick = false): React.CSSProperties => ({
    position: "absolute",
    left: `${(r.x / (natural?.width ?? 1)) * 100}%`,
    top: `${(r.y / (natural?.height ?? 1)) * 100}%`,
    width: `${(r.w / (natural?.width ?? 1)) * 100}%`,
    height: `${(r.h / (natural?.height ?? 1)) * 100}%`,
    border: `${thick ? 3 : 2}px solid ${color}`,
    background: `${color}22`,
    pointerEvents: "none",
  });

  const isTarget = (t: Target) =>
    !!target &&
    target.kind === t.kind &&
    target.fieldId === t.fieldId &&
    (t.kind !== "tick" || (target.kind === "tick" && target.option === t.option));

  return (
    <main className="wrap py-6">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text mb-4">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>
      <h1 className="font-display text-2xl text-text">Form calibration</h1>
      <p className="text-text-muted mb-4 font-body text-sm">
        Development tool. Pick a form image, list its fields, choose what to draw, then drag on the image. Copy the
        exported JSON into the template file.
      </p>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] items-start">
        <div>
          <div className="mb-3 flex flex-wrap gap-2 items-center">
            <select
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                setNatural(null);
              }}
              className="rounded-card border border-line bg-white px-3 py-2 text-sm"
              aria-label="Form image"
            >
              {IMAGES.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            <select
              defaultValue=""
              onChange={(e) => e.target.value && loadTemplate(e.target.value)}
              className="rounded-card border border-line bg-white px-3 py-2 text-sm"
              aria-label="Load an existing template"
            >
              <option value="">Load fields from a template...</option>
              {TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
            <span className="text-xs text-text-muted font-body">
              {natural ? `${natural.width} x ${natural.height}px` : "loading image..."}
            </span>
          </div>

          <div className="relative border border-line rounded-card overflow-hidden bg-white select-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Form being calibrated"
              className="w-full h-auto block"
              draggable={false}
              onLoad={(e) => setNatural({ width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight })}
            />
            {natural &&
              Object.entries(calibration).flatMap(([id, marks]) => {
                const selected = target?.fieldId === id;
                return [
                  marks.cell && <div key={`${id}-cell`} style={overlay(marks.cell, "#dc2626", selected)} title={id} />,
                  ...marks.mirrors.map((m, i) => (
                    <div key={`${id}-m${i}`} style={overlay(m, "#ea580c", selected)} title={`${id} mirror`} />
                  )),
                  ...Object.entries(marks.ticks).map(([o, r]) => (
                    <div key={`${id}-t${o}`} style={overlay(r, "#2563eb", selected)} title={`${id}: ${o}`} />
                  )),
                ];
              })}
            {natural && dragStart && dragNow && (
              <div style={overlay(rectFromDrag(dragStart, dragNow), "#16a34a", true)} />
            )}
            <div
              className="absolute inset-0"
              style={{ cursor: target ? "crosshair" : "default", touchAction: "none" }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            />
          </div>
          <p className="mt-2 text-xs text-text-muted font-body">
            Red = text area, orange = mirror area, blue = tick box, green = the box you are drawing.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <Card padding="sm">
            <CardHeader className="mb-2">
              <CardTitle className="text-base">Fields (JSON)</CardTitle>
              <CardDescription>
                An array of objects: id, label, optional options (for tick boxes) and required.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                value={fieldsText}
                onChange={(e) => setFieldsText(e.target.value)}
                rows={7}
                spellCheck={false}
                className="w-full rounded-card border border-line bg-white p-2 font-mono text-xs"
                aria-label="Field list"
              />
              {error && (
                <p className="text-sm text-rani font-body" role="alert">
                  {error}
                </p>
              )}
            </CardContent>
          </Card>

          <Card padding="sm">
            <CardHeader className="mb-2">
              <CardTitle className="text-base">What to draw</CardTitle>
              <CardDescription>
                {target
                  ? `Drawing: ${target.fieldId}${target.kind === "tick" ? ` / ${target.option}` : ` (${target.kind})`}`
                  : "Choose a button, then drag on the image."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto">
              {fields.map((f) => {
                const marks = calibration[f.id];
                const done =
                  !!marks && (!!marks.cell || marks.mirrors.length > 0 || Object.keys(marks.ticks).length > 0);
                return (
                  <div key={f.id} className="border border-line rounded-card p-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-body">
                        {done ? "✓ " : ""}
                        {f.label}
                        {f.required ? <span className="text-rani"> *</span> : null}
                        <span className="text-xs text-text-muted"> ({f.id})</span>
                      </span>
                      {done && (
                        <button
                          type="button"
                          title="Clear this field's boxes"
                          aria-label={`Clear ${f.id}`}
                          className="p-1 text-text-muted hover:text-rani"
                          onClick={() => setCalibration((c) => clearField(c, f.id))}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <Button
                        size="sm"
                        variant={isTarget({ kind: "cell", fieldId: f.id }) ? "primary" : "secondary"}
                        onClick={() => setTarget({ kind: "cell", fieldId: f.id })}
                      >
                        Area
                      </Button>
                      <Button
                        size="sm"
                        variant={isTarget({ kind: "mirror", fieldId: f.id }) ? "primary" : "secondary"}
                        onClick={() => setTarget({ kind: "mirror", fieldId: f.id })}
                      >
                        + Mirror
                      </Button>
                      {f.options?.map((o) => (
                        <Button
                          key={o}
                          size="sm"
                          variant={isTarget({ kind: "tick", fieldId: f.id, option: o }) ? "primary" : "outline"}
                          onClick={() => setTarget({ kind: "tick", fieldId: f.id, option: o })}
                        >
                          Tick: {o}
                        </Button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card padding="sm">
            <CardHeader className="mb-2">
              <CardTitle className="text-base">Export</CardTitle>
              <CardDescription>Merge these entries into the matching fields of the template JSON.</CardDescription>
            </CardHeader>
            <CardContent>
              {problems.length > 0 && (
                <ul className="mb-2 list-disc pl-5 text-sm text-rani font-body" role="status">
                  {problems.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              )}
              {problems.length === 0 && exported.length > 0 && (
                <p className="mb-2 text-sm text-jade font-body">No problems found.</p>
              )}
              <textarea
                readOnly
                value={exportText}
                rows={8}
                className="w-full rounded-card border border-line bg-paper p-2 font-mono text-xs"
                aria-label="Exported JSON"
              />
              <Button className="mt-2 w-full" onClick={copyExport} disabled={exported.length === 0}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy JSON"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
