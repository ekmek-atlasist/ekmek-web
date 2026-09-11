"use client";

import { doc, getDoc } from "firebase/firestore";
import { Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { LegalDocumentContent } from "@/components/legal/legal-document-content";
import { db } from "@/lib/firebase";
import {
  buildLegalDocumentMetaLine,
  parseLegalDocument,
} from "@/lib/legal-document-utils";
import type { LegalDocument } from "@/lib/legal-documents";

export type AuthLegalSheetType = "terms" | "privacy";

const DOC_IDS: Record<AuthLegalSheetType, string> = {
  terms: "kurumsal_terms",
  privacy: "kurumsal_privacy",
};

type AuthLegalSheetProps = {
  open: boolean;
  type: AuthLegalSheetType | null;
  onClose: () => void;
};

export function AuthLegalSheet({ open, type, onClose }: AuthLegalSheetProps) {
  const [document, setDocument] = useState<LegalDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !type) {
      setDocument(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void getDoc(doc(db, "legal_documents", DOC_IDS[type]))
      .then((snap) => {
        if (cancelled) return;
        if (!snap.exists()) {
          setDocument(null);
          setError("Metin yüklenemedi.");
          return;
        }
        setDocument(parseLegalDocument(snap.data()));
      })
      .catch(() => {
        if (!cancelled) setError("Metin yüklenemedi.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, type]);

  if (!open || !type) return null;

  const metaLine = document ? buildLegalDocumentMetaLine(document) : null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/45 p-4 backdrop-blur-[2px] sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-legal-sheet-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(85vh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4">
          <div className="min-w-0">
            <h3
              id="auth-legal-sheet-title"
              className="text-lg font-bold text-[#0f2540]"
            >
              {document?.title ??
                (type === "terms"
                  ? "Kullanım Şartları ve Üyelik Sözleşmesi"
                  : "Aydınlatma Metni")}
            </h3>
            {metaLine ? (
              <p className="mt-1 text-xs text-[#1a1a1a]/45">{metaLine}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-1.5 text-[#1a1a1a]/50 transition-colors hover:bg-neutral-100 hover:text-[#0f2540]"
            aria-label="Kapat"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-[#036AAF]" aria-hidden />
            </div>
          ) : error ? (
            <p className="py-8 text-center text-sm text-red-600">{error}</p>
          ) : document ? (
            <LegalDocumentContent document={document} />
          ) : null}
        </div>

        <div className="shrink-0 border-t border-neutral-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-[#036AAF] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#025a94]"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
