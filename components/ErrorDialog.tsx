"use client";

// ErrorDialog: a popup for a rejected answer or a failed step. An error line at the bottom of the page is easy to miss
// (testers only noticed it after a couple of tries), and many users cannot read it, so this opens over the page, reads
// a short Urdu message aloud, and has one big button to try again.
import { useEffect, useRef } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "./Button";
import { TTSButton } from "./TTS";

const URDU_MESSAGE = "یہ قبول نہیں ہوا۔ براہِ کرم دوبارہ کوشش کریں۔";
const ROMAN_MESSAGE = "Yeh qabool nahi hua. Barah-e-karam dobara koshish karein.";

interface ErrorDialogProps {
  // The error to show; null keeps the dialog closed.
  message: string | null;
  onClose: () => void;
}

export function ErrorDialog({ message, onClose }: ErrorDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isOpen = !!message;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
      buttonRef.current?.focus();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      // A tap on the dark backdrop also closes it.
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className="backdrop:bg-ink-2/70 backdrop:backdrop-blur-sm fixed inset-0 m-auto z-50 p-0 max-w-md w-[calc(100%-2rem)] bg-paper rounded-card border-2 border-rani/40 shadow-2xl overflow-hidden"
      aria-labelledby="error-dialog-title"
      aria-describedby="error-dialog-detail"
      role="alertdialog"
    >
      <div className="p-5 sm:p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-rani/10 text-rani flex items-center justify-center border border-rani/30">
          <AlertCircle className="w-9 h-9" />
        </div>

        <p id="error-dialog-title" className="font-urdu text-xl sm:text-2xl text-text" dir="rtl" lang="ur">
          {URDU_MESSAGE}
        </p>
        <p className="mt-1 text-sm text-text-muted font-body">{ROMAN_MESSAGE}</p>

        <div className="mt-4 flex justify-center">
          <TTSButton text={URDU_MESSAGE} fallbackText={ROMAN_MESSAGE} autoPlay size="lg" />
        </div>

        <p
          id="error-dialog-detail"
          className="mt-4 p-3 rounded-card bg-rani/10 border border-rani/20 text-rani text-sm sm:text-base font-body break-words"
        >
          {message}
        </p>

        <Button ref={buttonRef} type="button" size="lg" variant="marigold" className="mt-5 w-full" onClick={onClose}>
          <RotateCcw className="w-5 h-5" />
          Dobara koshish karein / Try again
        </Button>
      </div>
    </dialog>
  );
}
