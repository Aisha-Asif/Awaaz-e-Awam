"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/Button";

interface ImageCaptureProps {
  onImageCapture: (file: File) => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
  maxSizeMB?: number;
}

export function ImageCapture({
  onImageCapture,
  onError,
  disabled = false,
  maxSizeMB = 10
}: ImageCaptureProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraOpen(true);
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError("Camera access denied. Please allow camera permission or upload an image file.");
      } else {
        setError("Could not access camera. Please try uploading an image file.");
      }
      onError?.(err instanceof Error ? err : new Error("Unknown error"));
    }
  }, [onError]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const capturedFile = new File([blob], `form-${Date.now()}.jpg`, { type: "image/jpeg" });
        handleFileSelect(capturedFile);
        stopCamera();
      }
    }, "image/jpeg", 0.9);
  }, [stopCamera]);

  const handleFileSelect = useCallback((selectedFile: File) => {
    setError(null);

    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      setError(`File size must be less than ${maxSizeMB}MB.`);
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    setPreview(url);
    setFile(selectedFile);
  }, [maxSizeMB]);

  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  }, [handleFileSelect]);

  const removeImage = useCallback(() => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setFile(null);
  }, [preview]);

  const submitImage = useCallback(() => {
    if (file) {
      onImageCapture(file);
    }
  }, [file, onImageCapture]);

  useEffect(() => {
    return () => {
      stopCamera();
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview, stopCamera]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {isCameraOpen && (
        <div className="rounded-card border-2 border-line overflow-hidden">
          <div className="relative aspect-[4/3] bg-ink-2">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-3/4 h-3/4 border-2 border-on-ink/50 rounded-card" />
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={stopCamera}
                  className="bg-on-ink/90 text-ink px-6 py-3"
                >
                  Cancel
                </Button>
                <Button
                  size="lg"
                  onClick={capturePhoto}
                  className="bg-jade px-6 py-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.2A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.2A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Capture
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isCameraOpen && !preview && (
        <div className="space-y-4">
          <Button
            variant="primary"
            size="lg"
            onClick={startCamera}
            disabled={disabled}
            className="w-full"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.2A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.2A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Open Camera
          </Button>

          <div className="relative">
            <div className="flex items-center gap-3 text-text-muted text-sm">
              <div className="flex-1 h-px bg-line" />
              <span>or</span>
              <div className="flex-1 h-px bg-line" />
            </div>
            <label className="mt-4 block">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="sr-only"
                disabled={disabled}
              />
              <Button variant="ghost" size="lg" className="w-full" disabled={disabled}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload Image
              </Button>
            </label>
          </div>

          <p className="text-center text-sm text-text-muted font-body">
            Take a clear photo of the entire form with good lighting.
          </p>
        </div>
      )}

      {preview && !isCameraOpen && (
        <div className="rounded-card border-2 border-line overflow-hidden">
          <div className="relative aspect-[4/3] bg-line">
            <img
              src={preview}
              alt="Form preview"
              className="w-full h-full object-contain p-4"
            />
            <div className="absolute top-3 right-3 flex gap-2">
              <button
                onClick={removeImage}
                className="bg-on-ink/90 text-text-muted p-2 rounded-full hover:bg-on-ink transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <button
                onClick={() => setIsCameraOpen(true)}
                className="bg-on-ink/90 text-text-muted p-2 rounded-full hover:bg-on-ink transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.2A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.2A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                </svg>
              </button>
            </div>
          </div>
          <div className="p-4 flex justify-end">
            <Button size="lg" onClick={submitImage} disabled={disabled}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Use This Image
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rani/10 border border-rani/30 rounded-card text-rani text-sm text-center font-body" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
