export type LegalDocumentType =
  | "privacy"
  | "terms"
  | "community_guidelines"
  | "safe_usage_tips"
  | "faq";

export type LegalDocumentRole = "aday" | "kurumsal";

export const LEGAL_SLUG_TO_TYPE: Record<string, LegalDocumentType> = {
  gizlilik: "privacy",
  "kullanim-kosullari": "terms",
  "topluluk-kurallari": "community_guidelines",
  "guvenli-kullanim": "safe_usage_tips",
  sss: "faq",
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

export function resolveLegalDocumentType(slug: string): LegalDocumentType | null {
  return LEGAL_SLUG_TO_TYPE[slug] ?? null;
}

export function buildLegalDocumentId(
  role: LegalDocumentRole,
  type: LegalDocumentType,
): string {
  return `${role}_${type}`;
}

export const LEGAL_ROLE_LABELS: Record<
  LegalDocumentRole,
  { tab: string; onlyNotice: string }
> = {
  aday: {
    tab: "İş Arayanlar",
    onlyNotice: "Bu metin yalnızca iş arayanlar için geçerlidir.",
  },
  kurumsal: {
    tab: "İşverenler",
    onlyNotice: "Bu metin yalnızca işverenler için geçerlidir.",
  },
};

export const DUAL_AUDIENCE_SLUGS = new Set(["gizlilik", "kullanim-kosullari"]);
