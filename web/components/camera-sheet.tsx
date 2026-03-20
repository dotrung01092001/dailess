"use client";

import { motion } from "framer-motion";
import { Camera, CameraOff, RefreshCcw, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Props = {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onCapture: (file: File, filter: string) => Promise<void>;
};

const filters = [
  { id: "soft", label: "Soft" },
  { id: "warm", label: "Warm" },
  { id: "ocean", label: "Ocean" }
] as const;

export function CameraSheet({ open, loading, onClose, onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<(typeof filters)[number]["id"]>("soft");

  useEffect(() => {
    if (!open) return;
    setError("");

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" }
          },
          audio: false
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        setError("Camera access is needed to share a live moment.");
      }
    };

    void start();

    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[rgba(47,28,26,0.45)] px-4 pb-6 pt-10 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto flex h-full w-full max-w-md flex-col rounded-[34px] bg-[var(--panel-strong)] p-4 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Share instantly</p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--brown-deep)]">Capture a tiny memory</h2>
          </div>
          <button type="button" className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90" onClick={onClose}>
            <X className="h-5 w-5 text-[var(--brown-deep)]" />
          </button>
        </div>

        <div className="relative flex-1 overflow-hidden rounded-[30px] bg-[var(--brown-deep)]">
          {error ? (
            <div className="flex h-full flex-col items-center justify-center px-8 text-center text-white">
              <CameraOff className="h-8 w-8" />
              <p className="mt-4 text-base">{error}</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className={`h-full w-full ${
                  selectedFilter === "warm"
                    ? "sepia-[.2] saturate-125"
                    : selectedFilter === "ocean"
                      ? "hue-rotate-[165deg] saturate-115"
                      : "brightness-105"
                }`}
                playsInline
                muted
              />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/30 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/50 to-transparent" />
            </>
          )}
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {filters.map((filter) => (
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

        <div className="mt-4 flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/90">
            <RefreshCcw className="h-5 w-5 text-[var(--brown-deep)]" />
          </div>

          <button
            type="button"
            disabled={loading || !!error}
            className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-[var(--pink-strong)] text-white shadow-xl shadow-rose-200/40 disabled:opacity-60"
            onClick={async () => {
              if (!videoRef.current || !canvasRef.current) return;
              const video = videoRef.current;
              const canvas = canvasRef.current;
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const ctx = canvas.getContext("2d");
              if (!ctx) return;

              if (selectedFilter === "warm") {
                ctx.filter = "saturate(1.1) sepia(0.18)";
              } else if (selectedFilter === "ocean") {
                ctx.filter = "hue-rotate(165deg) saturate(1.12)";
              } else {
                ctx.filter = "brightness(1.05)";
              }

              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
              if (!blob) return;
              const file = new File([blob], `moment-${Date.now()}.jpg`, { type: "image/jpeg" });
              await onCapture(file, selectedFilter);
            }}
          >
            <Camera className="h-7 w-7" />
          </button>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/90">
            <Sparkles className="h-5 w-5 text-[var(--ocean-deep)]" />
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </motion.div>
    </div>
  );
}
