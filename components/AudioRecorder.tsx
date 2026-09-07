"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Mic, Square, RotateCcw, Check, UploadCloud, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/Button";
import { WaveformVisualizer } from "@/components/WaveformVisualizer";

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
  onRecordingStateChange?: (isRecording: boolean) => void;
}

export function AudioRecorder({
  onRecordingComplete,
  onError,
  showUploadFallback = true,
  onUpload,
  disabled = false,
  onRecordingStateChange
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

  useEffect(() => {
    onRecordingStateChange?.(status === "recording");
  }, [status, onRecordingStateChange]);

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

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <div className="flex flex-col items-center justify-center gap-3 py-2">
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 relative ${
            status === "recording"
              ? "bg-rani/15 ring-8 ring-rani/20 scale-105 shadow-lg shadow-rani/20"
              : status === "processing"
              ? "bg-jade/15 ring-8 ring-jade/20"
              : status === "success"
              ? "bg-jade/15 ring-8 ring-jade/20"
              : status === "error"
              ? "bg-rani/15 ring-8 ring-rani/20"
              : "bg-paper-subtle border border-line ring-4 ring-line/40 shadow-sm"
          }`}
        >
          {status === "recording" && (
            <span className="w-6 h-6 bg-rani rounded-md animate-pulse shadow-sm" />
          )}
          {status === "processing" && (
            <Loader2 className="h-9 w-9 text-jade animate-spin" />
          )}
          {status === "success" && (
            <Check className="w-9 h-9 text-jade stroke-[2.5]" />
          )}
          {status === "error" && (
            <AlertCircle className="w-9 h-9 text-rani" />
          )}
          {status === "idle" && (
            <Mic className="w-9 h-9 text-ink transition-transform duration-200 group-hover:scale-110" />
          )}
        </div>

        {status === "recording" && (
          <div className="w-full max-w-sm mt-3 space-y-3 animate-in fade-in duration-200">
            {/* Live animated waveform visualizer */}
            <WaveformVisualizer active={true} color="rani" />

            {/* Audio Recording Progress Bar */}
            <div className="bg-paper-subtle p-3.5 rounded-xl border border-line shadow-inner">
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <span className="flex items-center gap-2 text-rani font-medium">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rani opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rani"></span>
                  </span>
                  <span>Recording Voice / آواز سن رہے ہیں...</span>
                </span>
                <span className="font-mono text-xs font-bold text-rani bg-rani/10 px-2 py-0.5 rounded">
                  {formatTime(duration)}
                </span>
              </div>

              {/* Progress bar */}
              <div 
                className="w-full h-2 bg-paper border border-line/80 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={Math.min(100, Math.round((duration / 60) * 100))}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Recording progress"
              >
                <div
                  className="h-full bg-gradient-to-r from-marigold via-rani to-rani rounded-full transition-all duration-300 relative"
                  style={{ width: `${Math.min(100, Math.max(6, (duration / 60) * 100))}%` }}
                >
                  <div className="absolute inset-0 bg-white/25 animate-pulse" />
                </div>
              </div>

              <div className="flex justify-between items-center text-[11px] text-text-muted mt-2 font-body">
                <span>Speak naturally in Urdu / Roman Urdu</span>
                <span className="font-mono text-[10px] bg-paper px-1.5 py-0.5 rounded border border-line/60">
                  {duration}s / ~60s
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="text-center">
        {status !== "recording" && (
          <p className={`text-base font-semibold font-body ${statusColors[status]}`}>
            {statusLabels[status]}
            {status === "success" && (
              <span className="ml-2.5 px-2.5 py-0.5 rounded-full bg-jade/10 text-xs font-mono font-bold text-jade">
                {formatTime(duration)}
              </span>
            )}
          </p>
        )}
      </div>

      {error && (
        <div className="p-3.5 bg-rani-light border border-rani/30 rounded-card text-rani text-sm text-center font-body flex items-center justify-center gap-2" role="alert">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {uploadError && (
        <div className="p-3.5 bg-rani-light border border-rani/30 rounded-card text-rani text-sm text-center font-body flex items-center justify-center gap-2" role="alert">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {status === "idle" && (
          <Button
            size="lg"
            variant="marigold"
            onClick={startRecording}
            disabled={disabled}
            className="w-full sm:w-auto min-w-[180px]"
          >
            <Mic className="w-5 h-5" />
            Start Recording
          </Button>
        )}

        {status === "recording" && (
          <Button
            size="lg"
            variant="danger"
            onClick={stopRecording}
            className="w-full sm:w-auto min-w-[180px]"
          >
            <Square className="w-4 h-4 fill-current" />
            Stop Recording
          </Button>
        )}

        {status === "success" && (
          <>
            <Button
              size="md"
              variant="outline"
              onClick={cancelRecording}
              className="w-full sm:w-auto"
            >
              <RotateCcw className="w-4 h-4" />
              Re-record
            </Button>
            <Button
              size="md"
              variant="jade"
              onClick={() => audioBlob && onRecordingComplete?.(audioBlob)}
              className="w-full sm:w-auto"
            >
              <Check className="w-4 h-4" />
              Use Recording
            </Button>
          </>
        )}

        {status === "error" && (
          <Button
            size="lg"
            variant="secondary"
            onClick={startRecording}
            className="w-full sm:w-auto min-w-[180px]"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </Button>
        )}
      </div>

      {showUploadFallback && status !== "recording" && status !== "processing" && (
        <div className="pt-2">
          <div className="flex items-center gap-3 text-text-muted text-xs">
            <div className="flex-1 h-px bg-line" />
            <span className="uppercase tracking-wider">or upload voice note</span>
            <div className="flex-1 h-px bg-line" />
          </div>
          <div className="mt-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={disabled}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full py-2"
              disabled={disabled}
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud className="w-4 h-4 text-text-muted" />
              Upload Audio File (.mp3, .wav, .m4a, .webm)
            </Button>
          </div>
        </div>
      )}

      {audioUrl && status === "success" && (
        <div className="pt-2">
          <audio controls className="w-full rounded-card" src={audioUrl} />
        </div>
      )}
    </div>
  );
}
