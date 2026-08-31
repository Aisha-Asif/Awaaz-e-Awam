"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/Button";

export type RecordingStatus = "idle" | "recording" | "processing" | "success" | "error";

interface UseAudioRecorderOptions {
  onDataAvailable?: (blob: Blob) => void;
  onError?: (error: Error) => void;
  mimeType?: string;
}

interface UseAudioRecorderReturn {
  status: RecordingStatus;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  cancelRecording: () => void;
  audioBlob: Blob | null;
  audioUrl: string | null;
  duration: number;
  error: string | null;
}

export function useAudioRecorder({
  onDataAvailable,
  onError,
  mimeType = "audio/webm"
}: UseAudioRecorderOptions = {}): UseAudioRecorderReturn {
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetDuration = useCallback(() => {
    setDuration(0);
    startTimeRef.current = 0;
  }, []);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  const cleanup = useCallback(() => {
    stopTimer();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  }, [audioUrl, stopTimer]);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        onDataAvailable?.(blob);
        setStatus("success");
        stopTimer();
      };

      mediaRecorder.onerror = () => {
        const err = new Error("Recording failed");
        setError("Recording failed. Please try again.");
        onError?.(err);
        setStatus("error");
        cleanup();
      };

      mediaRecorder.start(100);
      setStatus("recording");
      resetDuration();
      startTimer();
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError("Microphone access denied. Please allow microphone permission or upload an audio file.");
      } else {
        setError("Could not access microphone. Please try uploading an audio file.");
      }
      setStatus("error");
      onError?.(err instanceof Error ? err : new Error("Unknown error"));
    }
  }, [mimeType, onDataAvailable, onError, startTimer, resetDuration, stopTimer, cleanup]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      setStatus("processing");
      mediaRecorderRef.current.stop();
    }
  }, []);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    cleanup();
    setAudioBlob(null);
    setAudioUrl(null);
    resetDuration();
    setStatus("idle");
  }, [cleanup, resetDuration]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    status,
    startRecording,
    stopRecording,
    cancelRecording,
    audioBlob,
    audioUrl,
    duration,
    error
  };
}

interface AudioRecorderProps {
  onRecordingComplete?: (blob: Blob) => void;
  onError?: (error: Error) => void;
  showUploadFallback?: boolean;
  onUpload?: (file: File) => void;
  disabled?: boolean;
}

export function AudioRecorder({
  onRecordingComplete,
  onError,
  showUploadFallback = true,
  onUpload,
  disabled = false
}: AudioRecorderProps) {
  const {
    status,
    startRecording,
    stopRecording,
    cancelRecording,
    audioBlob,
    audioUrl,
    duration,
    error
  } = useAudioRecorder({
    onDataAvailable: onRecordingComplete,
    onError
  });

  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      setUploadError("Please select an audio file.");
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setUploadError("File size must be less than 25MB.");
      return;
    }

    setUploadError(null);
    onUpload?.(file);
  }, [onUpload]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const statusLabels: Record<RecordingStatus, string> = {
    idle: "Ready",
    recording: "Recording...",
    processing: "Processing...",
    success: "Recorded",
    error: "Error"
  };

  const statusColors: Record<RecordingStatus, string> = {
    idle: "text-text-muted",
    recording: "text-rani",
    processing: "text-jade",
    success: "text-jade",
    error: "text-rani"
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <div className="flex items-center justify-center gap-4">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
            status === "recording"
              ? "bg-rani/10 animate-pulse ring-4 ring-rani/30"
              : status === "processing"
              ? "bg-jade/10 ring-4 ring-jade/30"
              : status === "success"
              ? "bg-jade/10 ring-4 ring-jade/30"
              : status === "error"
              ? "bg-rani/10 ring-4 ring-rani/30"
              : "bg-line ring-4 ring-ink/10"
          }`}
        >
          {status === "recording" && (
            <div className="w-4 h-4 bg-rani rounded-full animate-pulse" />
          )}
          {status === "processing" && (
            <svg className="animate-spin h-8 w-8 text-jade" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          {status === "success" && (
            <svg className="w-8 h-8 text-jade" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {status === "error" && (
            <svg className="w-8 h-8 text-rani" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {status === "idle" && (
            <svg className="w-8 h-8 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        </div>
      </div>

      <p className={`text-center text-lg font-medium font-body ${statusColors[status]}`}>
        {statusLabels[status]}
        {status === "recording" && <span className="ml-2 text-sm font-mono text-rani">{formatTime(duration)}</span>}
        {status === "success" && <span className="ml-2 text-sm font-mono text-jade">{formatTime(duration)}</span>}
      </p>

      {error && (
        <div className="p-3 bg-rani/10 border border-rani/30 rounded-card text-rani text-sm text-center font-body" role="alert">
          {error}
        </div>
      )}

      {uploadError && (
        <div className="p-3 bg-rani/10 border border-rani/30 rounded-card text-rani text-sm text-center font-body" role="alert">
          {uploadError}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {status === "idle" && (
          <Button
            size="lg"
            onClick={startRecording}
            disabled={disabled}
            className="w-full sm:w-auto min-w-[160px]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            Start Recording
          </Button>
        )}

        {status === "recording" && (
          <Button
            size="lg"
            variant="danger"
            onClick={stopRecording}
            className="w-full sm:w-auto min-w-[160px]"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h12v12H6z" />
            </svg>
            Stop Recording
          </Button>
        )}

        {status === "success" && (
          <>
            <Button
              size="lg"
              variant="ghost"
              onClick={cancelRecording}
              className="w-full sm:w-auto min-w-[160px]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Re-record
            </Button>
            <Button
              size="lg"
              onClick={() => audioBlob && onRecordingComplete?.(audioBlob)}
              className="w-full sm:w-auto min-w-[160px]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Use Recording
            </Button>
          </>
        )}

        {status === "error" && (
          <Button
            size="lg"
            variant="ghost"
            onClick={startRecording}
            className="w-full sm:w-auto min-w-[160px]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try Again
          </Button>
        )}
      </div>

      {showUploadFallback && status !== "recording" && status !== "processing" && (
        <div className="relative">
          <div className="flex items-center gap-3 text-text-muted text-sm">
            <div className="flex-1 h-px bg-line" />
            <span>or</span>
            <div className="flex-1 h-px bg-line" />
          </div>
          <label className="mt-4 block">
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="sr-only"
              disabled={disabled}
            />
            <Button variant="ghost" size="md" className="w-full" disabled={disabled}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload Audio File
            </Button>
          </label>
        </div>
      )}

      {audioUrl && status === "success" && (
        <audio controls className="w-full" src={audioUrl} />
      )}
    </div>
  );
}
