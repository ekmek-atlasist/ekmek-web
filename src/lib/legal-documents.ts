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

export const LEGAL_DUAL_ROUTE_CONFIG = {
  gizlilik: {
    adayDocId: "aday_privacy",
    kurumsalDocId: "kurumsal_privacy",
  },
  "kullanim-kosullari": {
    adayDocId: "aday_terms",
    kurumsalDocId: "kurumsal_terms",
  },
  "topluluk-kurallari": {
    adayDocId: "aday_community_guidelines",
    kurumsalDocId: "kurumsal_community_guidelines",
  },
  "guvenli-kullanim": {
    adayDocId: "aday_safe_usage_tips",
    kurumsalDocId: "kurumsal_safe_usage_tips",
  },
  sss: {
    adayDocId: "aday_faq",
    kurumsalDocId: "kurumsal_faq",
  },
} as const;

export type LegalDualRouteKey = keyof typeof LEGAL_DUAL_ROUTE_CONFIG;

export function getLegalDualRouteConfig(routeKey: LegalDualRouteKey) {
  return LEGAL_DUAL_ROUTE_CONFIG[routeKey];
}
