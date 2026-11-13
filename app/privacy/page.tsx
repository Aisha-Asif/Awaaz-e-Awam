// Privacy page: server-rendered summary of PRIVACY.md, linked from the consent notice and footer.
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { DEMO_WARNING_EN, DEMO_WARNING_UR } from "@/lib/privacy-copy";

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
              {DEMO_WARNING_EN}
              <span className="block font-urdu text-base mt-1 leading-relaxed" dir="rtl">
                {DEMO_WARNING_UR}
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
              <h3 className="font-display font-semibold text-text mb-1">Numbers you type</h3>
              <p className="text-text-muted">
                Your CNIC, phone number and dates are typed, never spoken. They are checked by the app itself and are
                not sent to an AI provider. Anything in a spoken answer that looks like a CNIC or phone number is
                removed before the text reaches the AI.
              </p>
            </div>

            <div>
              <h3 className="font-display font-semibold text-text mb-1">Your filled form</h3>
              <p className="text-text-muted">
                The finished form is drawn in your browser and saved or printed from there. It is not uploaded, and
                nothing is stored on the server. Signatures, thumb impressions, stamps and office areas are left blank
                for you to complete by hand. One person fills one form; nothing is kept for the next one.
              </p>
            </div>

            <div>
              <h3 className="font-display font-semibold text-text mb-1">Spoken answers</h3>
              <p className="text-text-muted">
                When you speak an answer, the recording is sent to a server-side speech-to-text service (Groq Whisper on
                the sensitive path, Gemini on the demo path). Do not say numbers or private details you are not
                comfortable sharing; you can type any answer instead.
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
