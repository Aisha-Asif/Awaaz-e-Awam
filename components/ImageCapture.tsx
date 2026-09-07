"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Camera, UploadCloud, X, RotateCcw, Check, AlertCircle, Image as ImageIcon } from "lucide-react";
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
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      // Set camera open FIRST so the video element renders
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

  // Attach stream to video element once it's mounted
  useEffect(() => {
    if (isCameraOpen && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraOpen]);

  const handleFileSelect = useCallback((selectedFile: File) => {
    setError(null);

    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select a valid image.");
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

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video) {
      setError("Camera not available. Please try again.");
      return;
    }

    setIsCapturing(true);
    setError(null);

    // Check if video is ready
    if (video.readyState < 2) {
      setError("Camera is not ready yet. Please wait a moment and try again.");
      setIsCapturing(false);
      return;
    }

    // Validate video dimensions
    if (video.videoWidth <= 0 || video.videoHeight <= 0) {
      setError("Camera is not ready yet. Please wait a moment and try again.");
      setIsCapturing(false);
      return;
    }

    // Create canvas dynamically if ref is null
    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvasRef.current = canvas;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      setError("Unable to capture the image. Please try again.");
      setIsCapturing(false);
      return;
    }

    // Set canvas dimensions to video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame
    try {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
    } catch {
      setError("Unable to capture the image. Please try again.");
      setIsCapturing(false);
      return;
    }

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (!blob || blob.size === 0) {
        setError("Unable to create the captured image. Please try again.");
        setIsCapturing(false);
        return;
      }

      const capturedFile = new File([blob], `form-${Date.now()}.jpg`, { type: "image/jpeg" });

      // Stop camera AFTER capturing the image
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setIsCameraOpen(false);

      // Set the captured image
      handleFileSelect(capturedFile);
      setIsCapturing(false);
    }, "image/jpeg", 0.9);
  }, [handleFileSelect]);

  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  }, [handleFileSelect]);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

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
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {isCameraOpen && (
        <div className="rounded-card border border-line-strong overflow-hidden shadow-lg bg-ink-2">
          <div className="relative aspect-[4/3]">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            {/* Viewfinder guide brackets */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6 sm:p-10">
              <div className="w-full h-full border-2 border-dashed border-white/60 rounded-card relative">
                <span className="absolute top-2 left-3 text-[11px] font-mono uppercase tracking-wider text-white/80 bg-black/40 px-2 py-0.5 rounded">
                  Align Form Within Frame
                </span>
              </div>
            </div>
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3 pointer-events-auto bg-ink/80 backdrop-blur-md px-4 py-2 rounded-pill border border-white/10">
              <Button
                variant="ghost"
                size="sm"
                onClick={stopCamera}
                disabled={isCapturing}
                className="text-on-ink hover:text-white"
              >
                Cancel
              </Button>
              <Button
                variant="jade"
                size="md"
                onClick={capturePhoto}
                disabled={isCapturing}
                className="px-6 shadow-md"
              >
                <Camera className="w-4 h-4" />
                {isCapturing ? "Capturing..." : "Capture Photo"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {!isCameraOpen && !preview && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={startCamera}
              disabled={disabled}
              className="flex flex-col items-center justify-center p-6 rounded-card border-2 border-dashed border-line hover:border-jade hover:bg-jade-light/30 transition-all duration-200 group text-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-jade/10 group-hover:bg-jade group-hover:text-white text-jade flex items-center justify-center mb-3 transition-colors duration-200">
                <Camera className="w-7 h-7" />
              </div>
              <span className="font-semibold text-text font-display text-base">Use Camera</span>
              <span className="text-xs text-text-muted mt-1 font-body">Capture directly with your device</span>
            </button>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleUploadClick}
              className={`flex flex-col items-center justify-center p-6 rounded-card border-2 border-dashed transition-all duration-200 text-center cursor-pointer group ${
                isDragging
                  ? "border-marigold bg-marigold-light/40"
                  : "border-line hover:border-marigold hover:bg-marigold-light/20"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
                disabled={disabled}
              />
              <div className="w-14 h-14 rounded-full bg-marigold/10 group-hover:bg-marigold group-hover:text-ink-2 text-marigold flex items-center justify-center mb-3 transition-colors duration-200">
                <UploadCloud className="w-7 h-7" />
              </div>
              <span className="font-semibold text-text font-display text-base">Upload Image</span>
              <span className="text-xs text-text-muted mt-1 font-body">Drop form image or click to browse</span>
            </div>
          </div>

          <div className="p-3.5 bg-paper-subtle border border-line rounded-card text-xs text-text-muted font-body flex items-start gap-2.5">
            <ImageIcon className="w-4 h-4 text-jade shrink-0 mt-0.5" />
            <span>
              <strong>Helpful tip:</strong> Lay the physical document on a flat surface in good lighting. Ensure all fields and printed headings are clearly visible.
            </span>
          </div>
        </div>
      )}

      {preview && !isCameraOpen && (
        <div className="rounded-card border border-line-strong overflow-hidden bg-paper-card shadow-md">
          <div className="relative aspect-[4/3] bg-paper-subtle flex items-center justify-center">
            <img
              src={preview}
              alt="Form preview"
              className="w-full h-full object-contain p-3"
            />
            <div className="absolute top-3 right-3 flex gap-2">
              <button
                type="button"
                onClick={removeImage}
                className="bg-ink/80 text-white p-2 rounded-full hover:bg-ink transition-colors shadow-sm"
                title="Remove image"
                aria-label="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="bg-ink/80 text-white p-2 rounded-full hover:bg-ink transition-colors shadow-sm"
                title="Retake photo"
                aria-label="Retake photo"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="p-4 bg-paper-card border-t border-line flex items-center justify-between gap-3">
            <Button variant="outline" size="sm" onClick={removeImage}>
              Change Image
            </Button>
            <Button variant="jade" size="md" onClick={submitImage} disabled={disabled}>
              <Check className="w-4 h-4" />
              Understand This Form
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rani-light border border-rani/30 rounded-card text-rani text-sm text-center font-body flex items-center justify-center gap-2" role="alert">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
