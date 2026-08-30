"use client";

import { Button } from "./Button";
import { Card, CardContent, CardFooter } from "./Card";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fieldId: string;
  value: string;
  questionUrdu: string;
}

export const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  fieldId,
  value,
  questionUrdu
}: ConfirmationDialogProps) => {
  if (!isOpen) return null;

  return (
    <Card variant="outlined" className="border-amber-300 bg-amber-50">
      <CardContent className="pt-0 text-center py-6">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-amber-900 mb-2">Confirm Important Information</h3>
        <p className="text-amber-800 mb-2">{questionUrdu}</p>
        <p className="text-2xl font-mono font-bold text-amber-900 mb-4">{value}</p>
        <CardFooter className="pt-4">
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => onClose()}>
              Edit
            </Button>
            <Button onClick={() => onConfirm()}>✓ Correct</Button>
          </div>
        </CardFooter>
      </CardContent>
    </Card>
  );
};

ConfirmationDialog.displayName = "ConfirmationDialog";