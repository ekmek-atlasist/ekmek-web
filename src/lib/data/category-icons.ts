/** Maps job category id → PNG filename under /public/images/categories/ */
const CATEGORY_ICON_FILES: Record<string, string> = {
  hukuk: "avukatlik",
};

export function getCategoryIconPath(categoryId: string): string {
  const file = CATEGORY_ICON_FILES[categoryId] ?? categoryId;
  return `/images/categories/${file}.png`;
}

export const MASCOT_IMAGES = {
  hero: "/images/mascots/giriss.png",
  jobSeeker: "/images/mascots/isarayan.png",
  employer: "/images/mascots/calisan.png",
  verified: "/images/mascots/onizle.png",
  discover: "/images/mascots/kesfet_complete.png",
  applications: "/images/mascots/basvurularim_complete.png",
  chat: "/images/mascots/sohbet_complete.png",
  profile: "/images/mascots/profile_complete.png",
} as const;
