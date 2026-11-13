// Forms page: the list of forms the app can fill in. Each card shows what the form is, how many questions it asks, what
// the app leaves blank, and links to the two ways of filling it (answer questions one at a time, or speak naturally).
// Server-rendered: it only reads the template list.
import Link from "next/link";
import { ArrowLeft, FileText, MessageSquare, Mic, PenLine } from "lucide-react";
import { TEMPLATES } from "@/lib/templates";

export const metadata = { title: "Forms — Awaaz-e-Awam" };

export default function FormsPage() {
  return (
    <>
      <header>
        <div className="headerbar">
          <Link href="/" className="wordmark">
            <span className="lat">Awaaz-e-Awam</span>
            <span className="urd urdu">آواز عوام</span>
          </Link>
        </div>
      </header>

      <section className="section">
        <div className="wrap" style={{ maxWidth: 820 }}>
          <Link
            href="/"
            className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-card border border-line bg-paper-card text-text font-semibold font-body hover:border-line-strong hover:bg-paper hover:shadow-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          <div
            className="section-head"
            style={{ textAlign: "left", marginBottom: 24, maxWidth: "none", marginLeft: 0 }}
          >
            <h2>Available forms</h2>
            <p>Pick a form. You answer its questions and get a filled copy you can print or save.</p>
          </div>

          <div className="space-y-5">
            {TEMPLATES.map((t) => (
              <article key={t.id} className="p-5 sm:p-6 rounded-card bg-paper-card border border-line shadow-sm">
                <h3 className="flex items-start gap-2 font-display text-xl font-semibold text-text">
                  <FileText className="w-5 h-5 mt-1 shrink-0 text-jade" />
                  {t.title}
                </h3>
                {t.description && <p className="mt-2 text-text-muted font-body">{t.description}</p>}
                <p className="mt-2 text-sm text-text-muted font-body">
                  {t.schema.fields.length} questions · {t.schema.fields.filter((f) => f.required).length} required
                </p>

                {t.leaveBlank && t.leaveBlank.length > 0 && (
                  <p className="mt-3 flex gap-2 text-sm text-text-muted font-body">
                    <PenLine className="w-4 h-4 mt-0.5 shrink-0 text-marigold" />
                    <span>
                      <strong className="text-text">You complete by hand:</strong> {t.leaveBlank.join("; ")}.
                    </span>
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-3">
                  <Link href={`/scan?form=${t.id}`} className="btn btn-marigold">
                    <MessageSquare className="w-[18px] h-[18px]" />
                    Answer questions
                  </Link>
                  <Link
                    href={`/speak?form=${t.id}`}
                    className="btn border border-line bg-paper-card text-text hover:border-line-strong hover:bg-paper"
                  >
                    <Mic className="w-[18px] h-[18px]" />
                    Speak naturally
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <p className="mt-6 text-sm text-text-muted font-body">
            This app does not submit anything to NADRA or any office. It prepares a filled copy for you to print or
            save. Forms change, so check the printout against the official form before using it.
          </p>
        </div>
      </section>
    </>
  );
}
