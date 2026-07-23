export const LEGAL_SLUG_TO_DOC_ID: Record<string, string> = {
  gizlilik: "kurumsal_privacy",
  "kullanim-kosullari": "kurumsal_terms",
  "topluluk-kurallari": "kurumsal_community_guidelines",
  "guvenli-kullanim": "kurumsal_safe_usage_tips",
  sss: "kurumsal_faq",
};

export type LegalDocumentSection = {
  title: string;
  body: string;
};

export type LegalDocument = {
  title: string;
  navigationTitle?: string;
  version?: string;
  lastUpdated?: string;
  format: "body" | "sections";
  body?: string;
  sections?: LegalDocumentSection[];
  updatedAt?: unknown;
};

export function resolveLegalDocumentId(slug: string): string | null {
  return LEGAL_SLUG_TO_DOC_ID[slug] ?? null;
}
