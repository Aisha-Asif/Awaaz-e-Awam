// Privacy page: server-rendered summary of PRIVACY.md, linked from the consent notice and footer.
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";

export const metadata = { title: "Privacy — Awaaz-e-Awam" };

export default function PrivacyPage() {
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
        <div className="wrap" style={{ maxWidth: 720 }}>
          <Link
            href="/"
            className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-card border border-line bg-paper-card text-text font-semibold font-body hover:border-line-strong hover:bg-paper hover:shadow-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          <div className="section-head" style={{ textAlign: "left", marginBottom: 24 }}>
            <h2>Privacy &amp; Data Handling</h2>
            <p>How your voice, transcript, and form data are handled.</p>
          </div>

          <div className="mb-6 p-3.5 rounded-xl bg-marigold/10 border border-marigold/30 flex items-start gap-3 text-sm text-text-muted font-body">
            <ShieldAlert className="w-[18px] h-[18px] text-marigold shrink-0 mt-0.5" />
            <span>
              This is a demo. Please don&apos;t enter real CNIC, phone, or identity information.
              <span className="block font-urdu text-base mt-1 leading-relaxed" dir="rtl">
                احتیاط: یہ ڈیمو ہے — اصل شناختی کارڈ یا فون نمبر درج نہ کریں۔
              </span>
            </span>
          </div>

          <div className="space-y-5 text-text font-body leading-relaxed">
            <div>
              <h3 className="font-display font-semibold text-text mb-1">Data path</h3>
              <p className="text-text-muted">
                <strong>demo</strong> (default) uses synthetic data only; text and vision may be sent to Gemini or
                DeepSeek. <strong>sensitive</strong> is for real citizen data — the app fails closed and refuses to send
                anything to Gemini/DeepSeek, allowing only PII-safe providers (Groq).
              </p>
            </div>

            <div>
              <h3 className="font-display font-semibold text-text mb-1">What leaves your device</h3>
              <p className="text-text-muted">
                Speak and Scan send your recording and the text derived from it to a server-side AI provider to build
                the form. The app does not store your audio or image. Scanned-form history stays in your browser only.
              </p>
            </div>

            <div>
              <h3 className="font-display font-semibold text-text mb-1">Keys</h3>
              <p className="text-text-muted">
                API keys are server-side only — never exposed to the browser and never committed.
              </p>
            </div>
          </div>

          <p className="text-xs text-text-muted font-body mt-8">
            Full details: <span className="font-mono">PRIVACY.md</span> in the repository.
          </p>
        </div>
      </section>
    </>
  );
}
