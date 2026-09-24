"use client";

import { Smartphone, X } from "lucide-react";
import { useEffect } from "react";
import { AppStoreButtons } from "@/components/app-store-buttons";
import { openPreferredAppStore } from "@/lib/app-store-links";

type EmployerMobileNoticeModalProps = {
  open: boolean;
  onClose: () => void;
  onDownloadApp?: () => void;
  onContinueAnyway?: () => void;
};

export function EmployerMobileNoticeModal({
  open,
  onClose,
  onDownloadApp,
  onContinueAnyway,
}: EmployerMobileNoticeModalProps) {
  useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/45 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="employer-mobile-notice-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-7"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#036AAF]/10 text-[#036AAF]">
            <Smartphone className="size-5" strokeWidth={2} aria-hidden />
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-[#0f2540]/50 transition-colors hover:bg-neutral-100 hover:text-[#0f2540]"
            aria-label="Kapat"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <h2
          id="employer-mobile-notice-title"
          className="mt-4 text-xl font-bold text-[#0f2540]"
        >
          Telefonda uygulamayı kullan
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[#1a1a1a]/70">
          İş arıyorsan tüm ilanlar ve mesajlar Ekmek uygulamasında. İşveren
          paneli ise bilgisayar için tasarlandı; ilan vermek istiyorsan
          bilgisayardan{" "}
          <span className="font-semibold text-[#0f2540]">ekmekisbul.com</span>{" "}
          adresine gir.
        </p>

        <AppStoreButtons
          className="mt-5"
          compact
          theme="light"
          layout="column"
        />

        <button
          type="button"
          onClick={() => {
            onClose();
            if (!openPreferredAppStore()) {
              onDownloadApp?.();
            }
          }}
          className="mt-4 w-full rounded-full bg-[#036AAF] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#025a94]"
        >
          Uygulamayı İndir
        </button>

        {onContinueAnyway ? (
          <button
            type="button"
            onClick={onContinueAnyway}
            className="mt-3 w-full rounded-full px-5 py-2.5 text-sm font-medium text-[#1a1a1a]/50 transition-colors hover:bg-neutral-100 hover:text-[#0f2540]"
          >
            Yine de işveren girişi yap
          </button>
        ) : null}
      </div>
    </div>
  );
}
