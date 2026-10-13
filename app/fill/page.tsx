"use client";

// Fill demo page: hand-typed answers on the template's field list, drawn live onto the form preview. Synthetic data only.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye } from "lucide-react";
import { Button } from "@/components/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";
import { FilledForm } from "@/components/FilledForm";
import { TEMPLATES } from "@/lib/templates";
import { getFieldValidator } from "@/lib/validation";

// Synthetic data only: never real identity details.
const DEMO: Record<string, string> = {
  fullName: "Ali Raza",
  fatherName: "Ahmed Raza",
  motherName: "Fatima Bibi",
  gender: "Male",
  maritalStatus: "Single",
  dateOfBirth: "12/04/1998",
  districtOfBirth: "Lahore",
  religion: "Islam",
  presentAddress: "House 12, Street 4, Model Town",
  presentCity: "Lahore",
  presentTehsil: "Model Town",
  presentDistrict: "Lahore",
  permanentAddress: "House 12, Street 4, Model Town",
  permanentCity: "Lahore",
  permanentTehsil: "Model Town",
  permanentDistrict: "Lahore",
  attesterName: "Imran Khan",
  attesterOffice: "Union Council 5",
  attesterDesignation: "Chairman",
  attesterCnic: "3520112345671",
  attesterMobile: "03001234567",
};

export default function FillPage() {
  const template = TEMPLATES[0];
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showBoxes, setShowBoxes] = useState(false);

  const sections = useMemo(() => {
    const map = new Map<string, typeof template.schema.fields>();
    for (const f of template.schema.fields) {
      const key = f.section ?? "Fields";
      map.set(key, [...(map.get(key) ?? []), f]);
    }
    return Array.from(map.entries());
  }, [template]);

  // Inline per-input validation error for cnic/phone/date; null when valid or not a validated type.
  const fieldError = (type: string, value: string): string | null => {
    if (!value.trim() || !["cnic", "phone", "date"].includes(type)) return null;
    const r: { valid: boolean; error?: string } = getFieldValidator(type)(value);
    return r.valid ? null : (r.error ?? "Invalid value.");
  };

  // /fill?demo=1 opens pre-filled, handy for screenshots and demos.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("demo") === "1") setAnswers(DEMO);
  }, []);

  const set = (id: string, value: string) => setAnswers((a) => ({ ...a, [id]: value }));

  return (
    <main className="wrap py-6 sm:py-10">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text mb-5">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl text-text">{template.title}</h1>
        <p className="text-text-muted mt-1">
          Prototype: answers are typed here for now. Voice interview will feed the same fields. Demo only, use synthetic
          data.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] items-start">
        <div className="flex flex-col gap-5">
          <Card padding="sm">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => setAnswers(DEMO)}>
                Fill demo data
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAnswers({})}>
                Clear
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowBoxes((s) => !s)} aria-pressed={showBoxes}>
                <Eye className="w-4 h-4" /> {showBoxes ? "Hide" : "Show"} boxes
              </Button>
            </div>
          </Card>

          {sections.map(([name, fields]) => (
            <Card key={name} padding="sm">
              <CardHeader className="mb-3">
                <CardTitle className="text-base">{name}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {fields.map((f) => {
                  const value = answers[f.id] ?? "";
                  const err = fieldError(f.type, value);
                  return (
                    <label key={f.id} className="block">
                      <span className="text-sm text-text-muted">{f.label}</span>
                      <input
                        value={value}
                        onChange={(e) => set(f.id, e.target.value)}
                        placeholder={f.type === "date" ? "DD/MM/YYYY" : undefined}
                        className="mt-1 w-full rounded-card border border-line bg-white px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-jade"
                      />
                      {err && <span className="text-xs text-rani">{err}</span>}
                    </label>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="lg:sticky lg:top-4">
          <Card padding="sm">
            <CardHeader className="mb-2">
              <CardTitle className="text-base">Filled form</CardTitle>
            </CardHeader>
            <FilledForm template={template} answers={answers} showBoxes={showBoxes} />
          </Card>
        </div>
      </div>
    </main>
  );
}
