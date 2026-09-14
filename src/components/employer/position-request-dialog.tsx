"use client";

import { Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPositionRequest, validatePositionRequestText } from "@/lib/position-requests";

type PositionRequestDialogProps = {
  open: boolean;
  initialText?: string;
  userId: string;
  userDisplayName?: string | null;
  onClose: () => void;
  onSuccess?: () => void;
};

export function PositionRequestDialog({
  open,
  initialText = "",
  userId,
  userDisplayName,
  onClose,
  onSuccess,
}: PositionRequestDialogProps) {
  const [text, setText] = useState(initialText);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) return;
    setText(initialText);
    setError(null);
    setSuccess(false);
    setIsSubmitting(false);
  }, [open, initialText]);

  if (!open) return null;

  async function handleSubmit() {
    const validationError = validatePositionRequestText(text);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createPositionRequest({
        userId,
        requestedText: text,
        userDisplayName,
      });
      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Talep gönderilemedi. Tekrar deneyin.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="position-request-title"
    >
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h2
            id="position-request-title"
            className="text-lg font-semibold text-[#0f2540]"
          >
            Meslek öner
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-full p-2 text-neutral-500 transition-colors hover:bg-neutral-100 disabled:opacity-50"
            aria-label="Kapat"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          {success ? (
            <p className="text-sm leading-relaxed text-[#1a1a1a]/70">
              Talebin geldi. Onaylanınca listeye eklenir.
            </p>
          ) : (
            <>
              <p className="text-sm leading-relaxed text-[#1a1a1a]/65">
                Aradığın meslek listede yoksa buraya yaz. Onaylanınca listeye
                eklenir.
              </p>
              <div>
                <label htmlFor="requested-position" className="sr-only">
                  Meslek adı
                </label>
                <input
                  id="requested-position"
                  type="text"
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    if (error) setError(null);
                  }}
                  maxLength={60}
                  placeholder="Örn: Pastane Şefi"
                  className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-[#0f2540] outline-none transition-colors focus:border-[#036AAF] focus:ring-2 focus:ring-[#036AAF]/15"
                />
                <p className="mt-2 text-xs text-neutral-500">
                  2–60 karakter
                </p>
              </div>
              {error ? (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              ) : null}
            </>
          )}
        </div>

        <div className="flex gap-3 border-t border-neutral-200 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 rounded-full border border-neutral-200 py-3 text-sm font-semibold text-[#0f2540] transition-colors hover:bg-neutral-50 disabled:opacity-50"
          >
            {success ? "Kapat" : "İptal"}
          </button>
          {!success ? (
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={isSubmitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#036AAF] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#025a94] disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Gönderiliyor
                </>
              ) : (
                "Gönder"
              )}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
