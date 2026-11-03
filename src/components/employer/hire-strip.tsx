"use client";

import { Handshake, Hourglass, X } from "lucide-react";
import type { HireRecord } from "@/lib/hires";

/** Eşleşme kartı ve sohbet başlığında kullanılan "işe alındı" rozeti. */
export function HiredBadge({ confirmed }: { confirmed: boolean }) {
  return (
    <span
      className={`mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        confirmed
          ? "bg-[#036AAF]/10 text-[#036AAF]"
          : "bg-neutral-100 text-neutral-500"
      }`}
    >
      <Handshake className="size-3 shrink-0" aria-hidden />
      {confirmed ? "İşe alındı" : "İşe alım onayı bekliyor"}
    </span>
  );
}

function StripShell({
  accent,
  children,
}: {
  accent: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`mb-2 rounded-xl px-3.5 py-2.5 ring-1 ${
        accent
          ? "bg-[#036AAF]/[0.06] ring-[#036AAF]/15"
          : "bg-neutral-50 ring-neutral-200/70"
      }`}
    >
      {children}
    </div>
  );
}

const buttonClassName =
  "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50";

type HireStripProps = {
  userType: "kurumsal" | "bireysel" | null;
  hire: HireRecord | null;
  hireLoaded: boolean;
  otherName: string;
  /** Hatırlatma için sohbetin karşılıklı ve yeterince uzun olması gerekir. */
  promptEligible: boolean;
  promptDismissed: boolean;
  isSubmitting: boolean;
  onMarkHired: () => void;
  onDismissPrompt: () => void;
  onRespond: (confirmed: boolean) => void;
};

/**
 * Mesaj kutusunun üstündeki işe alım şeridi. İşverene hatırlatma ya da
 * bekleme bilgisi, işçiye yalnızca onay sorusu gösterir.
 */
export function HireStrip({
  userType,
  hire,
  hireLoaded,
  otherName,
  promptEligible,
  promptDismissed,
  isSubmitting,
  onMarkHired,
  onDismissPrompt,
  onRespond,
}: HireStripProps) {
  if (!hireLoaded || !userType) return null;

  if (userType === "bireysel") {
    if (hire?.status !== "pending") return null;

    return (
      <StripShell accent>
        <div className="flex items-start gap-2.5">
          <Handshake className="mt-0.5 size-5 shrink-0 text-[#036AAF]" aria-hidden />
          <p className="text-sm font-medium text-[#0f2540]">
            {otherName} seni işe aldığını belirtti. Doğru mu?
          </p>
        </div>
        <div className="mt-2.5 flex gap-2">
          <button
            type="button"
            onClick={() => onRespond(true)}
            disabled={isSubmitting}
            className={`${buttonClassName} bg-[#036AAF] text-white hover:bg-[#025a94]`}
          >
            Evet
          </button>
          <button
            type="button"
            onClick={() => onRespond(false)}
            disabled={isSubmitting}
            className={`${buttonClassName} border border-neutral-200 bg-white text-[#0f2540] hover:bg-neutral-50`}
          >
            Hayır
          </button>
        </div>
      </StripShell>
    );
  }

  if (hire?.status === "pending") {
    return (
      <StripShell accent={false}>
        <p className="flex items-center gap-2.5 text-sm text-neutral-500">
          <Hourglass className="size-4 shrink-0" aria-hidden />
          İşe alım kaydedildi, onayı bekleniyor.
        </p>
      </StripShell>
    );
  }

  // confirmed / declined / cancelled — üç nokta menüsü yeterli, ısrar etme.
  if (hire !== null) return null;

  if (promptDismissed || !promptEligible) return null;

  return (
    <StripShell accent>
      <div className="flex items-center gap-2.5">
        <Handshake className="size-5 shrink-0 text-[#036AAF]" aria-hidden />
        <p className="min-w-0 flex-1 text-sm font-medium text-[#0f2540]">
          {otherName} kişisini işe aldın mı?
        </p>
        <button
          type="button"
          onClick={onMarkHired}
          disabled={isSubmitting}
          className={`${buttonClassName} bg-[#036AAF] text-white hover:bg-[#025a94]`}
        >
          İşe Aldım
        </button>
        <button
          type="button"
          onClick={onDismissPrompt}
          aria-label="Kapat"
          className="shrink-0 rounded-full p-1.5 text-neutral-400 transition-colors hover:bg-neutral-200/60 hover:text-neutral-600"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </StripShell>
  );
}
