"use client";

import Link from "next/link";
import { Mic, ScanLine, MessageSquare, Check, ShieldAlert, CheckCircle2, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <>
      <header>
        <div className="headerbar">
          <div className="wordmark">
            <span className="lat">Awaaz-e-Awam</span>
            <span className="urd urdu">آواز عوام</span>
          </div>
          <div className="flex items-center">
            <a 
              href="#privacy" 
              className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-xs font-medium bg-[#184039] border border-[#2b5850] text-on-ink hover:border-marigold/60 hover:text-on-ink transition-all shadow-sm group"
              title="Privacy Notice & Demo Disclaimer"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-marigold shrink-0 transition-transform group-hover:scale-110" />
              <span className="font-body">Demo Only • No Real CNIC</span>
            </a>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <div className="hero-eyebrow urdu">اپنی زبان میں بات کریں</div>
            <h1>Talk to the form.<br />Let it fill itself.</h1>
            <p className="hero-sub">
              Say your information out loud in Urdu, Roman Urdu, or a mix of both —
              or photograph a paper form and answer one plain question at a time.
              No forms vocabulary required.
            </p>
            <div className="hero-ctas">
              <Link href="/speak" className="btn btn-marigold">
                <Mic className="w-[18px] h-[18px]" />
                Speak naturally
              </Link>
              <Link href="/scan" className="btn btn-outline">
                <ScanLine className="w-[18px] h-[18px]" />
                Scan a form
              </Link>
            </div>
            <div className="hero-note"><span className="dot"></span>Works with typing too, if speaking isn&apos;t possible right now.</div>
          </div>

          <div className="illus-card">
            <span className="tag">how it feels</span>
            
            <div className="flex flex-col gap-3 pt-5 pb-1">
              {/* Bubble 1: Citizen speech in Urdu / Roman Urdu */}
              <div className="rounded-2xl p-4 bg-[#184039] border border-[#2c5b52] shadow-sm">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-rani/20 text-rani flex items-center justify-center">
                      <Mic className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-xs font-medium text-on-ink-muted">You speak / آپ بولیں</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1 h-3 bg-marigold rounded-full animate-[waveBar_0.8s_ease-in-out_infinite_alternate]" />
                    <span className="w-1 h-5 bg-marigold rounded-full animate-[waveBar_0.6s_ease-in-out_0.2s_infinite_alternate]" />
                    <span className="w-1 h-2.5 bg-marigold rounded-full animate-[waveBar_0.9s_ease-in-out_0.1s_infinite_alternate]" />
                    <span className="w-1 h-4 bg-marigold rounded-full animate-[waveBar_0.7s_ease-in-out_0.3s_infinite_alternate]" />
                  </div>
                </div>
                <p className="text-base sm:text-lg text-on-ink font-urdu leading-relaxed text-right" dir="rtl">
                  &ldquo;میرا نام فاطمہ بی بی ہے، شناختی کارڈ 35202-1234567-2، لاہور میں رہتی ہوں۔&rdquo;
                </p>
                <p className="text-xs text-on-ink-muted font-body mt-1">
                  &ldquo;Mera naam Fatima Bibi hai, CNIC 35202-1234567-2...&rdquo;
                </p>
              </div>

              {/* Transformation Indicator */}
              <div className="flex items-center justify-center gap-2 py-0.5 text-xs text-marigold font-medium">
                <span className="w-8 h-px bg-marigold/30" />
                <span className="text-[11px] tracking-wide uppercase text-on-ink-muted">AI fills the boxes</span>
                <span className="w-8 h-px bg-marigold/30" />
              </div>

              {/* Bubble 2: Extracted Form Fields */}
              <div className="rounded-2xl p-4 bg-paper-card text-text border border-line shadow-md">
                <div className="flex items-center justify-between border-b border-line pb-2 mb-2 text-xs">
                  <span className="font-semibold text-text uppercase tracking-wider font-body">Citizen Record Form</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-jade bg-jade/10 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Auto-Matched
                  </span>
                </div>
                <div className="space-y-1.5 text-xs sm:text-sm font-body">
                  <div className="flex items-center justify-between bg-paper px-2.5 py-1.5 rounded-lg border border-line/50">
                    <span className="text-text-muted">Full Name</span>
                    <span className="font-semibold text-text flex items-center gap-1.5">
                      Fatima Bibi
                      <Check className="w-3.5 h-3.5 text-jade stroke-[3]" />
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-paper px-2.5 py-1.5 rounded-lg border border-line/50">
                    <span className="text-text-muted">CNIC</span>
                    <span className="font-mono font-bold text-text flex items-center gap-1.5">
                      35202-1234567-2
                      <Check className="w-3.5 h-3.5 text-jade stroke-[3]" />
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-paper px-2.5 py-1.5 rounded-lg border border-line/50">
                    <span className="text-text-muted">City</span>
                    <span className="font-medium text-text flex items-center gap-1.5">
                      Lahore
                      <Check className="w-3.5 h-3.5 text-jade stroke-[3]" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <h2>Three steps, start to finish</h2>
            <p>No account, no bureaucratic vocabulary — just a conversation until every required box is filled.</p>
          </div>
          <div className="steps">
            <div className="step">
              <div className="step-rail"></div>
              <div className="step-num">1</div>
              <div className="step-icon flex items-center justify-center rounded-full bg-rani/15 text-rani border border-rani/20">
                <Mic className="w-5 h-5" />
              </div>
              <h3>Speak, or show a form</h3>
              <p>Record yourself talking naturally, or photograph a paper form so the AI can read its fields.</p>
            </div>
            <div className="step">
              <div className="step-rail"></div>
              <div className="step-num">2</div>
              <div className="step-icon flex items-center justify-center rounded-full bg-marigold/15 text-marigold border border-marigold/20">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3>It asks one question at a time</h3>
              <p>A single plain Urdu question appears — &ldquo;Aap ka poora naam kya hai?&rdquo; — never a wall of ten fields.</p>
            </div>
            <div className="step">
              <div className="step-num">3</div>
              <div className="step-icon flex items-center justify-center rounded-full bg-jade/15 text-jade border border-jade/20">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3>Answers are ready to copy</h3>
              <p>Every required field is validated and confirmed, laid out beside your original form to copy across.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{paddingTop:0}}>
        <div className="wrap">
          <div className="section-head">
            <h2>Choose how you begin</h2>
            <p>Both roads end at the same place — a completed form you can read back or copy.</p>
          </div>
          <div className="modes">
            <Link href="/speak" className="mode-card speak active:scale-[0.98] transition-transform duration-150">
              <div className="mode-icon">
                <Mic className="w-[26px] h-[26px] text-rani" />
              </div>
              <h3>Speak Naturally</h3>
              <p>Say everything in one go, in Urdu or Roman Urdu — the AI sorts your words into the right fields and asks about whatever&apos;s left.</p>
              <span className="mode-link inline-flex items-center gap-1.5">
                Start speaking <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
            <Link href="/scan" className="mode-card scan active:scale-[0.98] transition-transform duration-150">
              <div className="mode-icon">
                <ScanLine className="w-[26px] h-[26px] text-jade" />
              </div>
              <h3>Scan a Form</h3>
              <p>Photograph a paper form and the AI reads its fields, then interviews you about each one in plain Urdu.</p>
              <span className="mode-link inline-flex items-center gap-1.5">
                Scan a form <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section className="section" style={{paddingTop:0}}>
        <div className="wrap">
          <div className="demo">
            <div className="demo-copy">
              <h2>What the conversation looks like</h2>
              <p>Every question is short, spoken aloud, and shown on screen — so nothing depends on reading well or knowing the form&apos;s own wording.</p>
              <ul className="demo-list">
                <li>CNIC, phone, and birth date are always read back for confirmation</li>
                <li>Unclear answers are never guessed — you&apos;re asked again</li>
                <li>Typing is always available if speaking isn&apos;t possible</li>
              </ul>
            </div>
            <div className="phone">
              <div className="phone-head">
                <div className="avatar flex items-center justify-center">
                  <Mic className="w-3.5 h-3.5 text-paper" />
                </div>
                <div className="who">Citizen Information Form</div>
              </div>
              <div className="bubble q urdu">آپ کا سی این آئی سی نمبر کیا ہے؟</div>
              <div className="bubble a">
                <div className="waveform">
                  <span style={{height:6}}></span><span style={{height:12}}></span><span style={{height:8}}></span>
                  <span style={{height:14}}></span><span style={{height:7}}></span><span style={{height:11}}></span>
                  <span style={{height:5}}></span>
                </div>
                &ldquo;35202-1234567-1&rdquo;
              </div>
              <div className="extracted">
                <span className="label">CNIC</span>
                <span className="val inline-flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-jade stroke-[3]" />
                  3520212345671
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <div className="foot-note" id="privacy">
            <ShieldAlert className="w-[18px] h-[18px] text-rani shrink-0" />
            Demo only — please don&apos;t enter real CNIC, phone, or identity information.
          </div>
          <div className="foot-bottom">
            <span>Awaaz-e-Awam — Multi-Dialect Urdu Voice-to-Form Assistant</span>
            <span>Your voice. Your forms.</span>
          </div>
        </div>
      </footer>
    </>
  );
}
