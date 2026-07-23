"use client";

import { doc, getDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LegalDocumentContent } from "@/components/legal/legal-document-content";
import { db } from "@/lib/firebase";
import {
  buildLegalDocumentId,
  DUAL_AUDIENCE_SLUGS,
  LEGAL_ROLE_LABELS,
  resolveLegalDocumentType,
  type LegalDocument,
  type LegalDocumentRole,
} from "@/lib/legal-documents";

type PageState = "loading" | "ready" | "not-found" | "error";

type LoadedDocuments = Record<LegalDocumentRole, LegalDocument | null>;

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

async function loadLegalDocument(
  role: LegalDocumentRole,
  type: NonNullable<ReturnType<typeof resolveLegalDocumentType>>,
): Promise<LegalDocument | null> {
  const snap = await getDoc(
    doc(db, "legal_documents", buildLegalDocumentId(role, type)),
  );

  if (!snap.exists()) return null;
  return parseLegalDocument(snap.data());
}

function buildMetaLine(document: LegalDocument): string | null {
  const parts = [
    document.lastUpdated
      ? `Son güncelleme: ${document.lastUpdated}`
      : null,
    document.version ? `Sürüm ${document.version}` : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : null;
}

export default function LegalDocumentPage() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const documentType = resolveLegalDocumentType(slug);

  const [pageState, setPageState] = useState<PageState>("loading");
  const [documents, setDocuments] = useState<LoadedDocuments>({
    aday: null,
    kurumsal: null,
  });
  const [activeRole, setActiveRole] = useState<LegalDocumentRole>("aday");

  useEffect(() => {
    if (!documentType) {
      setDocuments({ aday: null, kurumsal: null });
      setPageState("not-found");
      return;
    }

    let cancelled = false;

    async function loadDocuments() {
      setPageState("loading");
      setDocuments({ aday: null, kurumsal: null });
      setActiveRole("aday");

      try {
        const [adayDoc, kurumsalDoc] = await Promise.all([
          loadLegalDocument("aday", documentType!),
          loadLegalDocument("kurumsal", documentType!),
        ]);

        if (cancelled) return;

        if (!adayDoc && !kurumsalDoc) {
          setPageState("not-found");
          return;
        }

        setDocuments({ aday: adayDoc, kurumsal: kurumsalDoc });
        setActiveRole(adayDoc ? "aday" : "kurumsal");
        setPageState("ready");
      } catch (err) {
        console.error("[Legal document load]", err);
        if (!cancelled) setPageState("error");
      }
    }

    void loadDocuments();

    return () => {
      cancelled = true;
    };
  }, [documentType, slug]);

  const availableRoles = useMemo(() => {
    const roles: LegalDocumentRole[] = [];
    if (documents.aday) roles.push("aday");
    if (documents.kurumsal) roles.push("kurumsal");
    return roles;
  }, [documents.aday, documents.kurumsal]);

  const showTabs = availableRoles.length > 1;
  const activeDocument =
    activeRole === "aday" ? documents.aday : documents.kurumsal;
  const onlyAvailableRole = availableRoles.length === 1 ? availableRoles[0] : null;
  const metaLine = activeDocument ? buildMetaLine(activeDocument) : null;
  const showDualAudienceNote =
    DUAL_AUDIENCE_SLUGS.has(slug) && showTabs;

  return (
    <main className="bg-white px-6 py-10 sm:px-8 sm:py-14">
      <article className="mx-auto max-w-[760px]">
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

        {pageState === "ready" && activeDocument ? (
          <>
            {showDualAudienceNote ? (
              <p className="mb-6 rounded-2xl border border-[#036AAF]/15 bg-[#036AAF]/5 px-4 py-3 text-sm leading-relaxed text-[#0f2540]/80">
                Bu sayfada hem iş arayanlar hem işverenler için metinlere aşağıdaki
                sekmelerden erişebilirsiniz.
              </p>
            ) : null}

            {showTabs ? (
              <div
                role="tablist"
                aria-label="Hedef kitle"
                className="mb-8 flex flex-wrap gap-2 border-b border-neutral-200/80 pb-4"
              >
                {availableRoles.map((role) => {
                  const isActive = activeRole === role;

                  return (
                    <button
                      key={role}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveRole(role)}
                      className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors sm:px-6 sm:py-3 sm:text-base ${
                        isActive
                          ? "bg-[#036AAF] text-white shadow-sm"
                          : "bg-[#f8f9fb] text-[#0f2540]/70 hover:bg-neutral-100 hover:text-[#0f2540]"
                      }`}
                    >
                      {LEGAL_ROLE_LABELS[role].tab}
                    </button>
                  );
                })}
              </div>
            ) : onlyAvailableRole ? (
              <p className="mb-6 text-sm text-[#1a1a1a]/55">
                {LEGAL_ROLE_LABELS[onlyAvailableRole].onlyNotice}
              </p>
            ) : null}

            <header className="border-b border-neutral-200/80 pb-8">
              <h1 className="text-3xl font-black tracking-tight text-[#0f2540] sm:text-4xl">
                {activeDocument.title}
              </h1>
              {metaLine ? (
                <p className="mt-3 text-sm text-[#1a1a1a]/45">{metaLine}</p>
              ) : null}
            </header>

            <div className="py-10">
              <LegalDocumentContent document={activeDocument} />
            </div>
          </>
        ) : null}
      </article>
    </main>
  );
}
