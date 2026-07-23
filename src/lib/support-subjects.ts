export const SUPPORT_SUBJECT_OPTIONS = [
  { id: "accountIssue", label: "Hesap ve giriş sorunları" },
  { id: "bugReport", label: "Uygulama hatası / teknik sorun" },
  { id: "matchOrApplication", label: "Eşleşme veya başvuru" },
  { id: "profileOrListing", label: "Profil veya ilan" },
  { id: "privacySecurity", label: "Gizlilik ve güvenlik" },
  { id: "featureRequest", label: "Öneri ve geri bildirim" },
  { id: "other", label: "Diğer" },
] as const;

export type SupportSubjectId = (typeof SUPPORT_SUBJECT_OPTIONS)[number]["id"];
