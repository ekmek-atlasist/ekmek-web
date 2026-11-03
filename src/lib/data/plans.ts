/**
 * İlan paketleri. Tanıtım döneminde tüm fiyatlar null ve ödeme kapalı;
 * ücretli döneme geçişte price/period doldurulup PAYMENTS_ENABLED açılır.
 */

export const PAYMENTS_ENABLED = false;

/** Ödeme ekranında gösterilen KDV oranı. */
export const VAT_RATE = 0.2;

export type Plan = {
  id: string;
  title: string;
  tagline: string;
  listingCount: string;
  features: string[];
  highlighted: boolean;
  price: number | null;
  currency: "TRY";
  period: "monthly" | "yearly" | null;
};

export const PLANS: Plan[] = [
  {
    id: "tek",
    title: "Tek İlan",
    tagline: "Deneme için",
    listingCount: "1 ilan",
    features: [
      "1 aktif ilan yayınla",
      "Gelen başvuruları değerlendir",
      "Adaylarla mesajlaş",
    ],
    highlighted: false,
    price: null,
    currency: "TRY",
    period: null,
  },
  {
    id: "bes",
    title: "5 İlan",
    tagline: "Büyüyen işletmeler için",
    listingCount: "5 ilan",
    features: [
      "Aynı anda 5 aktif ilan",
      "Aday havuzunda sınırsız kaydırma",
      "Gelen başvurularda öncelik",
      "Adaylarla mesajlaş",
    ],
    highlighted: true,
    price: null,
    currency: "TRY",
    period: null,
  },
  {
    id: "sinirsiz",
    title: "Sınırsız",
    tagline: "Sürekli eleman arayanlar için",
    listingCount: "Sınırsız ilan",
    features: [
      "Sınırsız aktif ilan",
      "Aday havuzunda sınırsız kaydırma",
      "İlanların listede üst sırada",
      "Öncelikli destek",
    ],
    highlighted: false,
    price: null,
    currency: "TRY",
    period: null,
  },
];

export function getPlanById(id: string | null | undefined): Plan | null {
  if (!id) return null;
  return PLANS.find((plan) => plan.id === id) ?? null;
}

/** Fiyat girilmediği sürece tutar yerine tire gösterilir. */
export function formatPlanAmount(
  amount: number | null,
  currency: Plan["currency"],
): string {
  if (amount === null) return "—";

  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
  }).format(amount);
}
