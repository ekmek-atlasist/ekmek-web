"use client";

import { doc, getDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { LegalDocumentContent } from "@/components/legal/legal-document-content";
import { db } from "@/lib/firebase";
import {
  buildLegalDocumentMetaLine,
  parseLegalDocument,
} from "@/lib/legal-document-utils";
import {
  getLegalDualRouteConfig,
  type LegalDocument,
  type LegalDualRouteKey,
} from "@/lib/legal-documents";

type PageState = "loading" | "ready" | "not-found" | "error";

type LoadedDocuments = {
  aday: LegalDocument | null;
  kurumsal: LegalDocument | null;
};

async function fetchLegalDocument(
  docId: string,
): Promise<LegalDocument | null> {
  const snap = await getDoc(doc(db, "legal_documents", docId));
  if (!snap.exists()) return null;
  return parseLegalDocument(snap.data());
}

function DocumentBlock({ document }: { document: LegalDocument }) {
  const metaLine = buildLegalDocumentMetaLine(document);

  return (
    <section>
      <header>
        <h1 className="text-2xl font-black tracking-tight text-[#0f2540] sm:text-3xl">
          {document.title}
        </h1>
        {metaLine ? (
          <p className="mt-3 text-sm text-[#1a1a1a]/45">{metaLine}</p>
        ) : null}
      </header>

      <div className="mt-8">
        <LegalDocumentContent document={document} />
      </div>
    </section>
  );
}

function EmployerDivider() {
  return (
    <div
      className="relative my-12 sm:my-14"
      role="separator"
      aria-label="İşveren metni"
    >
      <div className="absolute inset-0 flex items-center" aria-hidden>
        <div className="w-full border-t border-[#036AAF]/20" />
      </div>
      <div className="relative flex justify-center">
        <span className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#036AAF] ring-1 ring-[#036AAF]/20">
          İşveren Metni
        </span>
      </div>
    </div>
  );
}

type LegalDualPageProps = {
  routeKey: LegalDualRouteKey;
};

export function LegalDualPage({ routeKey }: LegalDualPageProps) {
  const { adayDocId, kurumsalDocId } = getLegalDualRouteConfig(routeKey);

  const [pageState, setPageState] = useState<PageState>("loading");
  const [documents, setDocuments] = useState<LoadedDocuments>({
    aday: null,
    kurumsal: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadDocuments() {
      setPageState("loading");
      setDocuments({ aday: null, kurumsal: null });

      try {
        const [aday, kurumsal] = await Promise.all([
          fetchLegalDocument(adayDocId),
          fetchLegalDocument(kurumsalDocId),
        ]);

        if (cancelled) return;

        if (!aday && !kurumsal) {
          setPageState("not-found");
          return;
        }

        setDocuments({ aday, kurumsal });
        setPageState("ready");
      } catch (err) {
        console.error("[Legal dual page load]", err);
        if (!cancelled) setPageState("error");
      }
    }

    void loadDocuments();

    return () => {
      cancelled = true;
    };
  }, [adayDocId, kurumsalDocId, routeKey]);

  return (
    <main className="bg-[#f5f6f8] px-4 py-5 sm:px-6 sm:py-8">
      {pageState === "loading" ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-7 animate-spin text-[#036AAF]" aria-hidden />
        </div>
      ) : null}

      {pageState === "not-found" || pageState === "error" ? (
        <div className="mx-auto max-w-[760px] rounded-2xl bg-white px-6 py-12 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-[#0f2540]">
            {pageState === "error"
              ? "Bu doküman şu anda görüntülenemiyor"
              : "Doküman bulunamadı"}
          </h1>
          {pageState === "error" ? (
            <p className="mt-3 text-sm text-[#1a1a1a]/65">
              Lütfen daha sonra tekrar deneyin.
            </p>
          ) : null}
        </div>
      ) : null}

      {pageState === "ready" ? (
        <article className="legal-paper-enter mx-auto max-w-[760px] rounded-2xl bg-white px-6 py-8 shadow-[0_8px_40px_rgba(15,37,64,0.08)] ring-1 ring-black/[0.04] sm:px-10 sm:py-10">
          {documents.aday ? <DocumentBlock document={documents.aday} /> : null}

          {documents.aday && documents.kurumsal ? <EmployerDivider /> : null}

          {documents.kurumsal ? (
            <DocumentBlock document={documents.kurumsal} />
          ) : null}
        </article>
      ) : null}
    </main>
  );
}
