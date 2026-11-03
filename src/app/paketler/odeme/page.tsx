"use client";

import { Info, Loader2, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { PaymentFormSlot } from "@/components/paketler/payment-form-slot";
import { useCorporateGuard } from "@/lib/auth/use-corporate-guard";
import {
  PAYMENTS_ENABLED,
  VAT_RATE,
  formatPlanAmount,
  getPlanById,
} from "@/lib/data/plans";

const PAYMENT_BRANDS = ["iyzico", "VISA", "Mastercard", "TROY"];

function PageLoader() {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center bg-[#f7f8fa] py-16">
      <Loader2 className="size-8 animate-spin text-[#036AAF]" aria-hidden />
    </div>
  );
}

function OdemeContent() {
  const guardStatus = useCorporateGuard();
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = getPlanById(searchParams.get("paket"));

  useEffect(() => {
    if (!plan) router.replace("/paketler");
  }, [plan, router]);

  if (guardStatus === "checking" || !plan) {
    return <PageLoader />;
  }

  const vatAmount = plan.price === null ? null : plan.price * VAT_RATE;
  const totalAmount = plan.price === null ? null : plan.price + plan.price * VAT_RATE;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f7f8fa]">
      <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl font-bold text-[#0f2540]">Ödeme</h1>

        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[#036AAF]/20 bg-[#eef4fa] p-4 sm:p-5">
          <Info className="mt-0.5 size-5 shrink-0 text-[#036AAF]" aria-hidden />
          <div>
            <p className="font-semibold text-[#0f2540]">Online ödeme yakında</p>
            <p className="mt-1 text-sm leading-relaxed text-[#1a1a1a]/65">
              Tanıtım dönemi boyunca tüm paketler ücretsiz. Ödeme sistemi
              açıldığında bu sayfadan güvenle satın alabileceksin.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px]">
          <section className="order-2 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6 lg:order-1">
            <PaymentFormSlot disabled={!PAYMENTS_ENABLED} />

            <div className="mt-6 space-y-3 border-t border-neutral-200/80 pt-5">
              <label className="flex items-start gap-2.5 text-sm text-[#1a1a1a]/70">
                <input
                  type="checkbox"
                  disabled={!PAYMENTS_ENABLED}
                  className="mt-0.5 size-4 shrink-0 rounded border-neutral-300 disabled:cursor-not-allowed"
                />
                <span>Ön Bilgilendirme Formu&apos;nu okudum ve onaylıyorum.</span>
              </label>
              <label className="flex items-start gap-2.5 text-sm text-[#1a1a1a]/70">
                <input
                  type="checkbox"
                  disabled={!PAYMENTS_ENABLED}
                  className="mt-0.5 size-4 shrink-0 rounded border-neutral-300 disabled:cursor-not-allowed"
                />
                <span>
                  Mesafeli Satış Sözleşmesi&apos;ni okudum ve onaylıyorum.
                </span>
              </label>
              <p className="text-xs text-neutral-400">
                Sözleşme metinleri yakında yayınlanacak.
              </p>
            </div>

            <button
              type="button"
              disabled={!PAYMENTS_ENABLED}
              title="Online ödeme yakında aktif olacak."
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#036AAF] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#025a94] disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500"
            >
              Yakında
            </button>

            <div className="mt-5 border-t border-neutral-200/80 pt-5">
              <p className="flex items-center justify-center gap-2 text-xs text-neutral-500">
                <Lock className="size-3.5 shrink-0" aria-hidden />
                Ödemeler iyzico güvencesiyle alınacaktır.
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                {PAYMENT_BRANDS.map((brand) => (
                  <span
                    key={brand}
                    className="rounded-md bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-neutral-500"
                  >
                    {brand}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-neutral-400">
              <span>İade ve İptal Politikası</span>
              <Link href="/gizlilik" className="hover:text-[#036AAF]">
                Gizlilik Politikası
              </Link>
              <Link href="/gizlilik" className="hover:text-[#036AAF]">
                KVKK Aydınlatma Metni
              </Link>
            </div>
          </section>

          <aside className="order-1 h-fit rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm lg:order-2">
            <h2 className="text-base font-bold text-[#0f2540]">Sipariş Özeti</h2>

            <div className="mt-4 rounded-xl bg-neutral-50 px-4 py-3 ring-1 ring-neutral-200/70">
              <p className="font-semibold text-[#0f2540]">{plan.title}</p>
              <p className="mt-0.5 text-sm text-neutral-500">{plan.tagline}</p>
            </div>

            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-neutral-500">Paket tutarı</dt>
                <dd className="font-medium text-[#1a1a1a]">
                  {formatPlanAmount(plan.price, plan.currency)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-neutral-500">KDV (%20)</dt>
                <dd className="font-medium text-[#1a1a1a]">
                  {formatPlanAmount(vatAmount, plan.currency)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-neutral-200/80 pt-2.5">
                <dt className="font-semibold text-[#0f2540]">
                  Toplam (KDV dahil)
                </dt>
                <dd className="font-bold text-[#0f2540]">
                  {formatPlanAmount(totalAmount, plan.currency)}
                </dd>
              </div>
            </dl>

            <p className="mt-4 text-xs leading-relaxed text-neutral-500">
              Tanıtım döneminde ücret alınmamaktadır.
            </p>

            <Link
              href="/paketler"
              className="mt-4 inline-block text-sm font-semibold text-[#036AAF] hover:underline"
            >
              Paketi değiştir
            </Link>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default function PaketlerOdemePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <OdemeContent />
    </Suspense>
  );
}
