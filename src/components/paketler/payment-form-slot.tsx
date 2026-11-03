"use client";

/**
 * Kart alanları ve taksit kutusu. Ödeme açıldığında iyzico Checkout Form
 * bu bileşenin yerine geçeceği için tek parça tutuldu.
 *
 * Alanlar bilinçli olarak kontrolsüz ve devre dışı: kart bilgisi state'e
 * alınmaz, hiçbir yere yazılmaz.
 */

const labelClassName = "block text-sm font-medium text-[#1a1a1a]/80";
const inputClassName =
  "mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-[#1a1a1a] placeholder:text-neutral-400 disabled:cursor-not-allowed";

type PaymentFormSlotProps = {
  disabled: boolean;
};

export function PaymentFormSlot({ disabled }: PaymentFormSlotProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-[#0f2540]">Kart Bilgileri</h3>

        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="payment-card-holder" className={labelClassName}>
              Kart Üzerindeki İsim
            </label>
            <input
              id="payment-card-holder"
              type="text"
              autoComplete="off"
              placeholder="Ad Soyad"
              disabled={disabled}
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="payment-card-number" className={labelClassName}>
              Kart Numarası
            </label>
            <input
              id="payment-card-number"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="0000 0000 0000 0000"
              disabled={disabled}
              className={inputClassName}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="payment-card-expiry" className={labelClassName}>
                Son Kullanma Tarihi
              </label>
              <input
                id="payment-card-expiry"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="AA/YY"
                disabled={disabled}
                className={inputClassName}
              />
            </div>
            <div>
              <label htmlFor="payment-card-cvc" className={labelClassName}>
                CVC
              </label>
              <input
                id="payment-card-cvc"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="000"
                disabled={disabled}
                className={inputClassName}
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-base font-bold text-[#0f2540]">
          Taksit Seçenekleri
        </h3>
        <p className="mt-3 rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-5 text-sm text-neutral-500">
          Kart numaranı girdiğinde taksit seçenekleri burada listelenecek.
        </p>
      </div>
    </div>
  );
}
