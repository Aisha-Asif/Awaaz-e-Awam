"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <header>
        <div className="headerbar">
          <div className="wordmark">
            <span className="lat">Awaaz-e-Awam</span>
            <span className="urd urdu">آواز عوام</span>
          </div>
          <nav><a href="#privacy">This is a demo — not for real CNIC data</a></nav>
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z"/><path d="M19 11a7 7 0 0 1-14 0"/><path d="M12 18v3"/></svg>
                Speak naturally
              </Link>
              <Link href="/scan" className="btn btn-outline">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8V6a2 2 0 0 1 2-2h2M4 16v2a2 2 0 0 0 2 2h2M20 8V6a2 2 0 0 0-2-2h-2M20 16v2a2 2 0 0 1-2 2h-2"/><circle cx="12" cy="12" r="3.2"/></svg>
                Scan a form
              </Link>
            </div>
            <div className="hero-note"><span className="dot"></span>Works with typing too, if speaking isn&apos;t possible right now.</div>
          </div>

          <div className="illus-card">
            <span className="tag">how it feels</span>
            <svg viewBox="0 0 420 320" width="100%" height="auto" role="img" aria-label="A phone with sound waves sending answers into a form, which fills in with checkmarks">
              <g opacity="0.35">
                <circle cx="386" cy="34" r="4" fill="#E29A34"/>
                <circle cx="368" cy="20" r="3" fill="#B23A32"/>
                <circle cx="402" cy="18" r="2.5" fill="#4F8F6D"/>
              </g>
              <rect x="34" y="64" width="118" height="212" rx="20" fill="#F4EFDD" opacity="0.08"/>
              <rect x="34" y="64" width="118" height="212" rx="20" stroke="#F4EFDD" strokeOpacity="0.35" strokeWidth="2"/>
              <rect x="52" y="88" width="82" height="150" rx="8" fill="#0C2420"/>
              <circle cx="93" cy="252" r="7" stroke="#F4EFDD" strokeOpacity="0.5" strokeWidth="2" fill="none"/>
              <g transform="translate(93,150)">
                <rect x="-12" y="-34" width="24" height="42" rx="12" fill="#E29A34"/>
                <path d="M-20 -2a20 20 0 0 0 40 0" stroke="#F4EFDD" strokeWidth="3" fill="none" strokeLinecap="round"/>
                <line x1="0" y1="18" x2="0" y2="30" stroke="#F4EFDD" strokeWidth="3" strokeLinecap="round"/>
              </g>
              <g stroke="#E29A34" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.9">
                <path d="M166 150 q10 -18 20 0 t20 0"/>
                <path d="M196 150 q10 -26 20 0 t20 0"/>
                <path d="M226 150 q10 -34 20 0 t20 0"/>
              </g>
              <rect x="256" y="60" width="132" height="220" rx="16" fill="#F4EFDD"/>
              <rect x="256" y="60" width="132" height="220" rx="16" stroke="#0C2420" strokeOpacity="0.08" strokeWidth="1.5"/>
              <rect x="276" y="84" width="60" height="10" rx="3" fill="#0C2420" opacity="0.55"/>
              <g fontFamily="Work Sans, sans-serif">
                <circle cx="284" cy="120" r="8" fill="#4F8F6D"/>
                <path d="M280 120l3 3 6-6" stroke="#F4EFDD" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="300" y="115" width="70" height="10" rx="3" fill="#0C2420" opacity="0.7"/>
                <circle cx="284" cy="150" r="8" fill="#4F8F6D"/>
                <path d="M280 150l3 3 6-6" stroke="#F4EFDD" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="300" y="145" width="56" height="10" rx="3" fill="#0C2420" opacity="0.7"/>
                <circle cx="284" cy="180" r="8" fill="#B23A32"/>
                <rect x="300" y="175" width="40" height="10" rx="3" fill="#0C2420" opacity="0.35"/>
                <circle cx="284" cy="210" r="8" fill="none" stroke="#0C2420" strokeOpacity="0.25" strokeWidth="2"/>
                <rect x="300" y="205" width="64" height="10" rx="3" fill="#0C2420" opacity="0.15"/>
                <circle cx="284" cy="240" r="8" fill="none" stroke="#0C2420" strokeOpacity="0.25" strokeWidth="2"/>
                <rect x="300" y="235" width="48" height="10" rx="3" fill="#0C2420" opacity="0.15"/>
              </g>
            </svg>
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
              <svg className="step-icon" viewBox="0 0 44 44" fill="none"><circle cx="22" cy="22" r="21" fill="#F6E3DE"/><path d="M22 27a5 5 0 0 0 5-5v-6a5 5 0 0 0-10 0v6a5 5 0 0 0 5 5Z" stroke="#B23A32" strokeWidth="2"/><path d="M14 21a8 8 0 0 0 16 0" stroke="#B23A32" strokeWidth="2" strokeLinecap="round"/><path d="M22 29v4" stroke="#B23A32" strokeWidth="2" strokeLinecap="round"/></svg>
              <h3>Speak, or show a form</h3>
              <p>Record yourself talking naturally, or photograph a paper form so the AI can read its fields.</p>
            </div>
            <div className="step">
              <div className="step-rail"></div>
              <div className="step-num">2</div>
              <svg className="step-icon" viewBox="0 0 44 44" fill="none"><circle cx="22" cy="22" r="21" fill="#F1E8D3"/><path d="M13 22c0-5 4-9 9-9s9 4 9 9" stroke="#E29A34" strokeWidth="2" strokeLinecap="round"/><path d="M13 22v3a2 2 0 0 0 2 2h1" stroke="#E29A34" strokeWidth="2" strokeLinecap="round"/><path d="M31 22v3a2 2 0 0 1-2 2h-1" stroke="#E29A34" strokeWidth="2" strokeLinecap="round"/><circle cx="15" cy="24" r="2.4" fill="#E29A34"/><circle cx="29" cy="24" r="2.4" fill="#E29A34"/></svg>
              <h3>It asks one question at a time</h3>
              <p>A single plain Urdu question appears — &ldquo;Aap ka poora naam kya hai?&rdquo; — never a wall of ten fields.</p>
            </div>
            <div className="step">
              <div className="step-num">3</div>
              <svg className="step-icon" viewBox="0 0 44 44" fill="none"><circle cx="22" cy="22" r="21" fill="#E2EEE6"/><path d="M14 22l6 6 10-12" stroke="#4F8F6D" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
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
            <Link href="/speak" className="mode-card speak">
              <div className="mode-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#B23A32" strokeWidth="2.2" strokeLinecap="round"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z"/><path d="M19 11a7 7 0 0 1-14 0"/><path d="M12 18v3"/></svg>
              </div>
              <h3>Speak Naturally</h3>
              <p>Say everything in one go, in Urdu or Roman Urdu — the AI sorts your words into the right fields and asks about whatever&apos;s left.</p>
              <span className="mode-link">Start speaking</span>
            </Link>
            <Link href="/scan" className="mode-card scan">
              <div className="mode-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4F8F6D" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8V6a2 2 0 0 1 2-2h2M4 16v2a2 2 0 0 0 2 2h2M20 8V6a2 2 0 0 0-2-2h-2M20 16v2a2 2 0 0 1-2 2h-2"/><circle cx="12" cy="12" r="3.2"/></svg>
              </div>
              <h3>Scan a Form</h3>
              <p>Photograph a paper form and the AI reads its fields, then interviews you about each one in plain Urdu.</p>
              <span className="mode-link">Scan a form</span>
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
                <div className="avatar">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F4EFDD" strokeWidth="2.4" strokeLinecap="round"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z"/><path d="M19 11a7 7 0 0 1-14 0"/></svg>
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
                <span className="val">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4F8F6D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7"/></svg>
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B23A32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flex:"none"}}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>
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
