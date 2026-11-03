"use client";

import { Handshake, Loader2, Undo2 } from "lucide-react";
import { useEffect, useRef } from "react";

export type HireDialogMode = "mark" | "undo";

type HireConfirmDialogProps = {
  mode: HireDialogMode | null;
  displayName: string;
  isSubmitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function HireConfirmDialog({
  mode,
  displayName,
  isSubmitting,
  onConfirm,
  onCancel,
}: HireConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Yanlışlıkla onaylamayı önlemek için odak "Vazgeç"te başlar.
  useEffect(() => {
    if (!mode) return;
    cancelRef.current?.focus();
  }, [mode]);

  if (!mode) return null;

  const isMark = mode === "mark";
  const Icon = isMark ? Handshake : Undo2;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hire-dialog-title"
    >
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="px-6 pt-6">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-[#036AAF]/10">
            <Icon className="size-6 text-[#036AAF]" strokeWidth={1.8} aria-hidden />
          </span>
          <h2
            id="hire-dialog-title"
            className="mt-4 text-lg font-semibold text-[#0f2540]"
          >
            {isMark ? "İşe aldın mı?" : "İşaret kaldırılsın mı?"}
          </h2>
          <p className="mt-2 pb-6 text-sm leading-relaxed text-[#1a1a1a]/65">
            {isMark
              ? `"${displayName}" kişisini işe aldığını kaydedeceğiz. Doğrulaması için kendisine de soracağız. İstersen sonra geri alabilirsin.`
              : `"${displayName}" için işe alım kaydı kaldırılacak. İstersen daha sonra tekrar işaretleyebilirsin.`}
          </p>
        </div>

        <div className="flex gap-3 border-t border-neutral-200 px-5 py-4">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 rounded-full border border-neutral-200 py-3 text-sm font-semibold text-[#0f2540] transition-colors hover:bg-neutral-50 disabled:opacity-50"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#036AAF] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#025a94] disabled:opacity-60"
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            {isMark ? "Evet, işe aldım" : "Geri al"}
          </button>
        </div>
      </div>
    </div>
  );
}
