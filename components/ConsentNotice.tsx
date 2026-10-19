"use client";

// ConsentNotice: lightweight, dismissible data-use notice shown before Speak/Scan collect
// data. Copy + placement only — the surface is restyled in WS4 (UI/UX).
import { useState } from "react";
import Link from "next/link";
import { ShieldAlert, X } from "lucide-react";

export const ConsentNotice = () => {
  // ponytail: session-only dismissal; no persistence until real consent accounting exists.
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div
      role="note"
      className="mb-5 p-3.5 rounded-xl bg-marigold/10 border border-marigold/30 flex items-start gap-3 text-sm"
    >
      <ShieldAlert className="w-[18px] h-[18px] text-marigold shrink-0 mt-0.5" />
      <div className="flex-1 text-text-muted font-body">
        <p>
          Your voice and answers are sent to an AI provider to build the form. Don&apos;t enter real CNIC or phone
          details in this demo.{" "}
          <Link href="/privacy" className="underline text-text font-semibold hover:text-marigold">
            Privacy
          </Link>
        </p>
        <p className="font-urdu text-base mt-1 leading-relaxed" dir="rtl">
          احتیاط: یہ ڈیمو ہے — اصل شناختی کارڈ یا فون نمبر درج نہ کریں۔
        </p>
      </div>
      <button
        type="button"
        aria-label="Dismiss notice"
        onClick={() => setDismissed(true)}
        className="text-text-muted hover:text-text shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

ConsentNotice.displayName = "ConsentNotice";
