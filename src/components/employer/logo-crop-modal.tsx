"use client";

import "react-easy-crop/react-easy-crop.css";

import Cropper, { type Area, type Point } from "react-easy-crop";
import { Loader2, X, ZoomIn } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  analyzeLogoImage,
  EMPLOYER_LOGO_ASPECT,
  getContainedLogoBlob,
  getCroppedImageBlob,
  type LogoUploadMode,
} from "@/app/isveren/kayit/crop-image";

type LogoCropModalProps = {
  imageSrc: string;
  onClose: () => void;
  onConfirm: (blob: Blob) => Promise<void>;
};

export function LogoCropModal({
  imageSrc,
  onClose,
  onConfirm,
}: LogoCropModalProps) {
  const [mode, setMode] = useState<LogoUploadMode>("contain");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cropError, setCropError] = useState<string | null>(null);
  const [analysisHint, setAnalysisHint] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function runAnalysis() {
      setIsAnalyzing(true);
      try {
        const analysis = await analyzeLogoImage(imageSrc);
        if (cancelled) return;

        setMode(analysis.suggestedMode);
        setBackgroundColor(analysis.suggestedBackground);
        setAnalysisHint(
          analysis.suggestedMode === "contain"
            ? "Geniş veya şeffaf logo — sığdırma daha uygun."
            : "Kapak fotoğrafı gibi — kırpabilirsin.",
        );
      } catch {
        if (!cancelled) {
          setMode("contain");
          setAnalysisHint(null);
        }
      } finally {
        if (!cancelled) setIsAnalyzing(false);
      }
    }

    void runAnalysis();
    return () => {
      cancelled = true;
    };
  }, [imageSrc]);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function handleConfirm() {
    setIsProcessing(true);
    setCropError(null);

    try {
      const blob =
        mode === "cover"
          ? await getCroppedImageBlob(imageSrc, croppedAreaPixels ?? {
              x: 0,
              y: 0,
              width: 1,
              height: 1,
            })
          : await getContainedLogoBlob(imageSrc, backgroundColor);

      await onConfirm(blob);
    } catch (err) {
      console.error("[Logo crop]", err);
      setCropError("Görsel işlenemedi. Lütfen tekrar deneyin.");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logo-crop-title"
    >
      <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-[#0f2540] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 id="logo-crop-title" className="text-lg font-semibold text-white">
              İşletme görseli
            </h2>
            <p className="mt-0.5 text-xs text-white/55">
              Uygulamadaki kart boyutuna göre kaydedilir
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
            aria-label="Kapat"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex gap-2 border-b border-white/10 px-5 py-3">
          <button
            type="button"
            onClick={() => setMode("contain")}
            className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold transition-colors ${
              mode === "contain"
                ? "bg-white text-[#0f2540]"
                : "bg-white/8 text-white/75 hover:bg-white/12"
            }`}
          >
            Logo sığdır
          </button>
          <button
            type="button"
            onClick={() => setMode("cover")}
            className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold transition-colors ${
              mode === "cover"
                ? "bg-white text-[#0f2540]"
                : "bg-white/8 text-white/75 hover:bg-white/12"
            }`}
          >
            Kapak gibi kırp
          </button>
        </div>

        {analysisHint && !isAnalyzing ? (
          <p className="border-b border-white/10 px-5 py-2.5 text-xs leading-relaxed text-[#7ec8ff]">
            {analysisHint}
          </p>
        ) : null}

        <div className="relative h-[min(48vh,380px)] bg-black">
          {isAnalyzing ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="size-8 animate-spin text-white/60" aria-hidden />
            </div>
          ) : mode === "cover" ? (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={EMPLOYER_LOGO_ASPECT}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              objectFit="contain"
            />
          ) : (
            <div
              className="flex h-full items-center justify-center p-6"
              style={{ backgroundColor }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageSrc}
                alt=""
                className="max-h-full max-w-full object-contain"
              />
            </div>
          )}
        </div>

        <div className="space-y-4 px-5 py-4">
          {mode === "cover" ? (
            <div className="flex items-center gap-3">
              <ZoomIn className="size-4 shrink-0 text-white/60" aria-hidden />
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                disabled={isProcessing || isAnalyzing}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-[#036AAF]"
                aria-label="Yakınlaştır"
              />
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-white/75">Arka plan rengi</span>
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                disabled={isProcessing || isAnalyzing}
                className="size-10 cursor-pointer rounded-xl border border-white/15 bg-transparent p-1"
                aria-label="Arka plan rengi"
              />
            </div>
          )}

          {cropError ? (
            <p className="text-sm text-red-300" role="alert">
              {cropError}
            </p>
          ) : null}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 rounded-full border border-white/20 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 disabled:opacity-50"
            >
              İptal
            </button>
            <button
              type="button"
              onClick={() => void handleConfirm()}
              disabled={
                isProcessing ||
                isAnalyzing ||
                (mode === "cover" && !croppedAreaPixels)
              }
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#036AAF] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#025a94] disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  İşleniyor
                </>
              ) : (
                "Onayla"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
