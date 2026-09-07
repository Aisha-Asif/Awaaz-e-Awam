"use client";

import { useEffect, useRef } from "react";
import { Check, Edit3, ShieldAlert } from "lucide-react";
import { Button } from "./Button";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fieldId: string;
  value: string;
  questionUrdu: string;
  title?: string;
}

export const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  value,
  questionUrdu,
  title = "Confirm Important Information"
}: ConfirmationDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      if (!dialog.open) {
        dialog.showModal();
      }
      // Set initial focus to the primary confirmation button
      const timer = setTimeout(() => {
        confirmBtnRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      if (dialog.open) {
        dialog.close();
      }
      previousActiveElement.current?.focus();
    }
  }, [isOpen]);

  // Handle native cancel event (triggered by Escape key)
  const handleCancel = (e: React.SyntheticEvent) => {
    e.preventDefault();
    onClose();
  };

  // Keyboard trap fallback to ensure tabbing stays inside the dialog
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDialogElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }

    if (e.key === "Tab") {
      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusableElements = dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleCancel}
      onKeyDown={handleKeyDown}
      className="backdrop:bg-ink-2/70 backdrop:backdrop-blur-sm fixed inset-0 m-auto z-50 p-0 max-w-lg w-[calc(100%-2rem)] bg-paper rounded-card border-2 border-marigold/50 shadow-2xl overflow-hidden focus:outline-none"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-desc"
    >
      <div className="p-6 sm:p-8 text-center bg-paper">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-marigold/15 text-marigold flex items-center justify-center border border-marigold/30 shadow-inner">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <h3 id="dialog-title" className="text-xl font-bold font-display text-text mb-1">
          {title}
        </h3>
        <p className="text-xs uppercase tracking-widest text-text-muted font-medium mb-3">
          Tasdeeq / Verification Required
        </p>

        <p id="dialog-desc" className="text-text-muted mb-3 font-urdu text-2xl leading-relaxed" dir="rtl">
          {questionUrdu}
        </p>

        <div className="inline-block px-5 py-3 my-2 rounded-xl bg-paper-card border border-marigold/30 shadow-sm max-w-full">
          <p className="text-2xl sm:text-3xl font-mono font-bold text-text tracking-wide break-all">
            {value}
          </p>
        </div>

        <p className="text-xs text-text-muted font-body mt-2 mb-6">
          Please confirm this detail matches your official document before continuing.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            className="w-full sm:w-auto px-5"
          >
            <Edit3 className="w-4 h-4" />
            Edit / Dobara Bolein
          </Button>
          <Button
            ref={confirmBtnRef}
            type="button"
            variant="marigold"
            size="md"
            onClick={onConfirm}
            className="w-full sm:w-auto px-6 font-semibold"
          >
            <Check className="w-4 h-4" />
            Sahi Hai / Correct
          </Button>
        </div>
      </div>
    </dialog>
  );
};

ConfirmationDialog.displayName = "ConfirmationDialog";