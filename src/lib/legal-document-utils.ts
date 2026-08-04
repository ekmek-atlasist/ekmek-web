import type { LegalDocument, LegalDocumentSection } from "@/lib/legal-documents";

export function normalizeLastUpdated(value: string): string {
  return value.replace(/^Son güncelleme:\s*/i, "").trim();
}

export function normalizeVersion(value: string): string {
  return value.replace(/^Sürüm\s*/i, "").replace(/^v/i, "").trim();
}

export function buildLegalDocumentMetaLine(
  document: LegalDocument,
): string | null {
  const parts = [
    document.lastUpdated
      ? `Son güncelleme: ${normalizeLastUpdated(document.lastUpdated)}`
      : null,
    document.version
      ? `Sürüm ${normalizeVersion(document.version)}`
      : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : null;
}

export function parseLegalDocument(
  data: Record<string, unknown>,
): LegalDocument | null {
  const title = typeof data.title === "string" ? data.title.trim() : "";
  const format = data.format === "sections" ? "sections" : "body";

  if (!title) return null;

  return {
    title,
    navigationTitle:
      typeof data.navigationTitle === "string"
        ? data.navigationTitle.trim()
        : undefined,
    version:
      typeof data.version === "string"
        ? normalizeVersion(data.version.trim())
        : undefined,
    lastUpdated:
      typeof data.lastUpdated === "string"
        ? normalizeLastUpdated(data.lastUpdated.trim())
        : undefined,
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
          .filter((section): section is LegalDocumentSection =>
            Boolean(section),
          )
      : undefined,
    updatedAt: data.updatedAt,
  };
}
