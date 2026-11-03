"use client";

import { Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { PLANS } from "@/lib/data/plans";
import { useCorporateGuard } from "@/lib/auth/use-corporate-guard";

const cardClassName =
  "rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm";

export default function PaketlerPage() {
  const guardStatus = useCorporateGuard();

  if (guardStatus === "checking") {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center bg-[#f7f8fa] py-16">
        <Loader2 className="size-8 animate-spin text-[#036AAF]" aria-hidden />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f7f8fa]">
      <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl font-bold text-[#0f2540]">Paketler</h1>

        <section className="mt-6 rounded-2xl border border-[#036AAF]/20 bg-gradient-to-br from-[#eef4fa] to-white p-5 shadow-sm sm:p-6">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-[#036AAF]">
            TANITIM DÖNEMİ
          </p>
          <h2 className="mt-2 text-xl font-bold text-[#0f2540] sm:text-2xl">
            Tüm paketler şu an ücretsiz
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#1a1a1a]/65">
            İlan yayınlamak, başvuru almak ve adaylarla konuşmak için hiçbir
            ücret alınmıyor. İlanını bu dönemde açarsan tanıtım süresi boyunca
            ücretsiz kalır.
          </p>
        </section>

        <p className="mt-8 text-[11px] font-semibold tracking-[0.14em] text-neutral-500">
          PAKETLER
        </p>

        <div className="mt-3 grid gap-4 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <article
              key={plan.id}
              className={`relative flex flex-col ${
                plan.highlighted
                  ? "rounded-2xl border-2 border-[#036AAF] bg-white p-5 shadow-md"
                  : cardClassName
              }`}
            >
              {plan.highlighted ? (
                <span className="absolute -top-3 left-5 rounded-full bg-[#036AAF] px-3 py-1 text-[10px] font-bold tracking-[0.1em] text-white">
                  POPÜLER
                </span>
              ) : null}

              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-[#0f2540]">
                    {plan.title}
                  </h3>
                  <p className="mt-0.5 text-sm text-neutral-500">
                    {plan.tagline}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200/70">
                  Ücretsiz
                </span>
              </div>

              <ul className="mt-5 flex-1 space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#036AAF]/10">
                      <Check
                        className="size-3 text-[#036AAF]"
                        strokeWidth={3}
                        aria-hidden
                      />
                    </span>
                    <span className="text-sm leading-relaxed text-[#1a1a1a]/75">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <p className="mt-5 rounded-xl bg-neutral-50 px-3.5 py-2.5 text-xs font-medium text-neutral-600 ring-1 ring-neutral-200/70">
                {plan.listingCount} · şu an açık
              </p>

              <Link
                href={`/paketler/odeme?paket=${plan.id}`}
                className={`mt-4 inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                  plan.highlighted
                    ? "bg-[#036AAF] text-white hover:bg-[#025a94]"
                    : "border border-[#036AAF]/25 bg-white text-[#036AAF] hover:bg-[#036AAF]/5"
                }`}
              >
                Satın Al
              </Link>
            </article>
          ))}
        </div>

        <p className="mt-8 text-sm leading-relaxed text-neutral-500">
          Ücretli döneme geçmeden önce sizi önceden haberdar edeceğiz. O güne
          kadar yayında olan ilanlarınız ücretsiz kalmaya devam eder.
        </p>
      </main>
    </div>
  );
}
