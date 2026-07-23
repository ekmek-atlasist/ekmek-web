"use client";

import { doc, getDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LegalDocumentContent } from "@/components/legal/legal-document-content";
import { db } from "@/lib/firebase";
import {
  resolveLegalDocumentId,
  type LegalDocument,
} from "@/lib/legal-documents";

type PageState = "loading" | "ready" | "not-found" | "error";

function parseLegalDocument(data: Record<string, unknown>): LegalDocument | null {
  const title = typeof data.title === "string" ? data.title.trim() : "";
  const format = data.format === "sections" ? "sections" : "body";

  if (!title) return null;

  return {
    title,
    navigationTitle:
      typeof data.navigationTitle === "string"
        ? data.navigationTitle.trim()
        : undefined,
    version: typeof data.version === "string" ? data.version.trim() : undefined,
    lastUpdated:
      typeof data.lastUpdated === "string" ? data.lastUpdated.trim() : undefined,
    format,
    body: typeof data.body === "string" ? data.body : undefined,
    sections: Array.isArray(data.sections)
      ? data.sections
          .map((section) => {
            if (!section || typeof section !== "object") return null;
            const record = section as Record<string, unknown>;
            const sectionTitle =
              typeof record.title === "string" ? record.title.trim() : "";
            const sectionBody =
              typeof record.body === "string" ? record.body : "";
            if (!sectionTitle) return null;
            return { title: sectionTitle, body: sectionBody };
          })
          .filter((section): section is NonNullable<typeof section> =>
            Boolean(section),
          )
      : undefined,
    updatedAt: data.updatedAt,
  };
}

export default function LegalDocumentPage() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const firestoreId = resolveLegalDocumentId(slug);

  const [pageState, setPageState] = useState<PageState>("loading");
  const [document, setDocument] = useState<LegalDocument | null>(null);

  useEffect(() => {
    if (!firestoreId) {
      setDocument(null);
      setPageState("not-found");
      return;
    }

    let cancelled = false;

    async function loadDocument() {
      setPageState("loading");
      setDocument(null);

      try {
        const snap = await getDoc(doc(db, "legal_documents", firestoreId!));

        if (cancelled) return;

        if (!snap.exists()) {
          setPageState("error");
          return;
        }

        const parsed = parseLegalDocument(snap.data());
        if (!parsed) {
          setPageState("error");
          return;
        }

        setDocument(parsed);
        setPageState("ready");
      } catch (err) {
        console.error("[Legal document load]", err);
        if (!cancelled) setPageState("error");
      }
    }

    void loadDocument();

    return () => {
      cancelled = true;
    };
  }, [firestoreId]);

  const metaParts = [
    document?.lastUpdated
      ? `Son güncelleme: ${document.lastUpdated}`
      : null,
    document?.version ? `v${document.version}` : null,
  ].filter(Boolean);

  return (
    <main className="bg-white px-6 py-10 sm:px-8 sm:py-14">
      <article className="mx-auto max-w-[720px]">
        {pageState === "loading" ? (
          <div className="flex items-center justify-center py-20">
            <Loader2
              className="size-8 animate-spin text-[#036AAF]"
              aria-hidden
            />
          </div>
        ) : null}

        {pageState === "not-found" ? (
          <div className="rounded-2xl border border-neutral-200 bg-[#f8f9fb] px-6 py-12 text-center">
            <h1 className="text-2xl font-bold text-[#0f2540]">
              Doküman bulunamadı
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[#1a1a1a]/65">
              Aradığınız sayfa mevcut değil veya kaldırılmış olabilir.
            </p>
          </div>
        ) : null}

        {pageState === "error" ? (
          <div className="rounded-2xl border border-neutral-200 bg-[#f8f9fb] px-6 py-12 text-center">
            <h1 className="text-2xl font-bold text-[#0f2540]">
              Bu doküman şu anda görüntülenemiyor
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[#1a1a1a]/65">
              Lütfen daha sonra tekrar deneyin.
            </p>
          </div>
        ) : null}

        {pageState === "ready" && document ? (
          <>
            <header className="border-b border-neutral-200/80 pb-8">
              <h1 className="text-3xl font-black tracking-tight text-[#0f2540] sm:text-4xl">
                {document.title}
              </h1>
              {metaParts.length > 0 ? (
                <p className="mt-3 text-sm text-[#1a1a1a]/45">
                  {metaParts.join(" · ")}
                </p>
              ) : null}
            </header>

            <div className="py-10">
              <LegalDocumentContent document={document} />
            </div>
          </>
        ) : null}
      </article>
    </main>
  );
}
