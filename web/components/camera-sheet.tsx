"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, Camera, CameraOff, LoaderCircle, RefreshCcw, RotateCcw, Send, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cameraFilters, type CameraFilterId, getCameraFilterStyle } from "../lib/camera-filters";

type Props = {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onCapture: (file: File, filter: string, caption: string) => Promise<void>;
};

export function CameraSheet({ open, loading, onClose, onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState("");
  const [caption, setCaption] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<CameraFilterId>("soft");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("environment");
  const hasPreview = Boolean(previewUrl && capturedFile);

  const clearPreview = useCallback(() => {
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    setCapturedFile(null);
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    try {
      stopStream();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: cameraFacing }
        },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setError("");
    } catch {
      setError("Camera access is needed to share a live moment.");
    }
  }, [cameraFacing, stopStream]);

  useEffect(() => {
    if (!open) return;
    setError("");
    setCaption("");
    setPreviewUrl(null);
    setCapturedFile(null);
    setCameraFacing("environment");

    return () => {
      stopStream();
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
    };
  }, [open, stopStream]);

  useEffect(() => {
    if (!open || hasPreview) return;
    void startCamera();
  }, [open, hasPreview, startCamera]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[rgba(47,28,26,0.45)] px-4 pb-6 pt-10 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto flex h-full w-full max-w-md flex-col rounded-[34px] bg-[var(--panel-strong)] p-4 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90"
            onClick={() => {
              if (hasPreview) {
                clearPreview();
                void startCamera();
                return;
              }
              onClose();
            }}
          >
            <ArrowLeft className="h-5 w-5 text-[var(--brown-deep)]" />
          </button>
          <div className="flex-1">
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Share instantly</p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--brown-deep)]">
              {hasPreview ? "Choose this moment?" : "Capture a tiny memory"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {!hasPreview ? (
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 disabled:opacity-50"
                onClick={() => setCameraFacing((current) => (current === "environment" ? "user" : "environment"))}
                disabled={loading || !!error}
                aria-label="Switch camera"
              >
                <RefreshCcw className="h-5 w-5 text-[var(--brown-deep)]" />
              </button>
            ) : null}
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90">
              <Sparkles className="h-5 w-5 text-[var(--ocean-deep)]" />
            </div>
          </div>
        </div>

        <div className="relative flex-1 overflow-hidden rounded-[30px] bg-[var(--brown-deep)]">
          {error ? (
            <div className="flex h-full flex-col items-center justify-center px-8 text-center text-white">
              <CameraOff className="h-8 w-8" />
              <p className="mt-4 text-base">{error}</p>
            </div>
          ) : hasPreview ? (
            <div className="relative h-full w-full">
              <Image
                src={previewUrl!}
                alt="Captured moment preview"
                fill
                unoptimized
                className="object-cover"
                style={{ filter: getCameraFilterStyle(selectedFilter) }}
              />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/30 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/50 to-transparent" />
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                style={{
                  filter: getCameraFilterStyle(selectedFilter),
                  transform: cameraFacing === "user" ? "scaleX(-1)" : undefined
                }}
                playsInline
                muted
              />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/30 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/50 to-transparent" />
            </>
          )}

          {loading ? (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[rgba(47,28,26,0.52)] text-center text-white backdrop-blur-sm">
              <LoaderCircle className="h-8 w-8 animate-spin" />
              <div>
                <p className="text-base font-medium">Sending your moment...</p>
                <p className="mt-1 text-sm text-white/80">Compressing the photo and wrapping it softly.</p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {cameraFilters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={`rounded-full px-4 py-2 text-sm ${
                selectedFilter === filter.id ? "bg-[var(--brown-deep)] text-white" : "bg-white text-[var(--brown)]"
              }`}
              onClick={() => setSelectedFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <label className="mt-4 block">
          <span className="mb-2 block text-sm text-[var(--muted)]">A little note for this moment</span>
          <textarea
            rows={2}
            maxLength={140}
            className="w-full rounded-[24px] border border-[var(--border)] bg-white/90 px-4 py-3 outline-none"
            placeholder="A tiny thought, a sweet joke, or why this photo matters..."
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
          />
        </label>

        <div className="mt-4 flex items-center justify-center gap-3">
          {hasPreview ? (
            <>
              <button
                type="button"
                className="flex items-center gap-2 rounded-full bg-white px-4 py-3 text-sm text-[var(--brown-deep)]"
                onClick={() => {
                  clearPreview();
                  void startCamera();
                }}
                disabled={loading}
              >
                <RotateCcw className="h-4 w-4" />
                Retake
              </button>
              <button
                type="button"
                disabled={loading || !capturedFile}
                className="flex items-center gap-2 rounded-full bg-[var(--brown-deep)] px-5 py-3 text-sm text-white disabled:opacity-60"
                onClick={async () => {
                  if (!capturedFile) return;
                  await onCapture(capturedFile, selectedFilter, caption.trim());
                }}
              >
                {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Post this moment
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={loading || !!error}
              className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-[var(--pink-strong)] text-white shadow-xl shadow-rose-200/40 disabled:opacity-60"
              onClick={async () => {
                if (!videoRef.current || !canvasRef.current) return;
                const video = videoRef.current;
                const canvas = canvasRef.current;
                const maxSize = 1440;
                const ratio = Math.min(maxSize / video.videoWidth, maxSize / video.videoHeight, 1);
                canvas.width = Math.round(video.videoWidth * ratio);
                canvas.height = Math.round(video.videoHeight * ratio);
                const ctx = canvas.getContext("2d");
                if (!ctx) return;

                ctx.filter = getCameraFilterStyle(selectedFilter);
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
                if (!blob) return;
                const file = new File([blob], `moment-${Date.now()}.jpg`, { type: "image/jpeg" });
                setCapturedFile(file);
                setPreviewUrl((current) => {
                  if (current) URL.revokeObjectURL(current);
                  return URL.createObjectURL(file);
                });
              }}
            >
              {loading ? <LoaderCircle className="h-7 w-7 animate-spin" /> : <Camera className="h-7 w-7" />}
            </button>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </motion.div>
    </div>
  );
}
