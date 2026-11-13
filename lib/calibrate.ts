// Calibration helpers: pure logic behind the /calibrate page, where you draw boxes on a form image and export the
// template JSON. Everything here works in page pixels (the image's natural size) so it is easy to test.
import type { RawRect } from "@/lib/templates";

export type Point = { x: number; y: number };
export type Size = { width: number; height: number };

// What was drawn for one field: its text area, extra (mirror) areas, and a tick box per option.
export type FieldMarks = {
  cell?: RawRect;
  mirrors: RawRect[];
  ticks: Record<string, RawRect>;
};

export type Calibration = Record<string, FieldMarks>;

// A field to calibrate: the id and label come from the template; options mean tick boxes may be drawn.
export type CalibrationField = { id: string; label: string; options?: string[]; required?: boolean };

// Smallest box worth keeping (pixels); anything smaller is almost certainly an accidental click.
export const MIN_BOX = 6;

// Converts a pointer position on the displayed image into page pixels (the image's natural size), clamped to the page.
export function toImagePoint(
  client: Point,
  shown: { left: number; top: number; width: number; height: number },
  natural: Size,
): Point {
  const x = ((client.x - shown.left) / shown.width) * natural.width;
  const y = ((client.y - shown.top) / shown.height) * natural.height;
  return {
    x: Math.min(Math.max(Math.round(x), 0), natural.width),
    y: Math.min(Math.max(Math.round(y), 0), natural.height),
  };
}

// The rectangle between two drag points, in any direction, as whole pixels.
export function rectFromDrag(a: Point, b: Point): RawRect {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(a.x - b.x),
    h: Math.abs(a.y - b.y),
  };
}

export function emptyMarks(): FieldMarks {
  return { mirrors: [], ticks: {} };
}

// What the next drawn rectangle is for.
export type Target =
  | { kind: "cell"; fieldId: string }
  | { kind: "mirror"; fieldId: string }
  | { kind: "tick"; fieldId: string; option: string };

// Returns a new calibration with the rectangle stored for the target (the input is not modified).
export function applyRect(calibration: Calibration, target: Target, rect: RawRect): Calibration {
  const current = calibration[target.fieldId] ?? emptyMarks();
  const next: FieldMarks = { cell: current.cell, mirrors: [...current.mirrors], ticks: { ...current.ticks } };
  if (target.kind === "cell") next.cell = rect;
  else if (target.kind === "mirror") next.mirrors.push(rect);
  else next.ticks[target.option] = rect;
  return { ...calibration, [target.fieldId]: next };
}

// Removes the stored boxes for a field.
export function clearField(calibration: Calibration, fieldId: string): Calibration {
  const next = { ...calibration };
  delete next[fieldId];
  return next;
}

// The JSON fragment to paste into a template file: one entry per field that has any marks, in field order.
export type ExportedField = {
  id: string;
  cell?: RawRect;
  mirrors?: RawRect[];
  ticks?: { option: string; box: RawRect }[];
};

export function exportCalibration(calibration: Calibration, fields: CalibrationField[]): ExportedField[] {
  const out: ExportedField[] = [];
  for (const field of fields) {
    const marks = calibration[field.id];
    if (!marks) continue;
    const entry: ExportedField = { id: field.id };
    if (marks.cell) entry.cell = marks.cell;
    if (marks.mirrors.length) entry.mirrors = marks.mirrors;
    const options = field.options ?? Object.keys(marks.ticks);
    const ticks = options.filter((o) => marks.ticks[o]).map((o) => ({ option: o, box: marks.ticks[o] }));
    if (ticks.length) entry.ticks = ticks;
    if (entry.cell || entry.mirrors || entry.ticks) out.push(entry);
  }
  return out;
}

// Problems to fix before using the export. Empty means it looks complete.
export function validateCalibration(calibration: Calibration, fields: CalibrationField[], page: Size): string[] {
  const problems: string[] = [];
  const check = (label: string, r: RawRect) => {
    if (r.w < MIN_BOX || r.h < MIN_BOX) problems.push(`${label}: box is too small (${r.w}x${r.h}px)`);
    if (r.x < 0 || r.y < 0 || r.x + r.w > page.width || r.y + r.h > page.height) {
      problems.push(`${label}: box goes outside the page`);
    }
  };

  for (const field of fields) {
    const marks = calibration[field.id];
    const hasTicks = !!field.options?.length && !!marks && Object.keys(marks.ticks).length > 0;

    if (!marks || (!marks.cell && !hasTicks && !marks.mirrors.length)) {
      if (field.required) problems.push(`${field.id}: required field has no box yet`);
      continue;
    }
    if (marks.cell) check(`${field.id} area`, marks.cell);
    marks.mirrors.forEach((m, i) => check(`${field.id} mirror ${i + 1}`, m));
    for (const [option, r] of Object.entries(marks.ticks)) check(`${field.id} tick "${option}"`, r);
    if (hasTicks && field.options) {
      for (const o of field.options) {
        if (!marks.ticks[o]) problems.push(`${field.id}: option "${o}" has no tick box`);
      }
    }
  }
  return problems;
}
