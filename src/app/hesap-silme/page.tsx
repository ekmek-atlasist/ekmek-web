"use client";

import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, doc, getDoc } from "firebase/firestore";
import { Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";

const fieldClassName =
  "w-full rounded-2xl border border-neutral-200/80 bg-white px-5 py-3.5 text-base text-[#1a1a1a] shadow-sm outline-none transition-shadow placeholder:text-neutral-400 focus:border-[#036AAF]/40 focus:shadow-[0_0_0_3px_rgba(3,106,175,0.12)] disabled:cursor-not-allowed disabled:opacity-60";

const labelClassName = "mb-1.5 block text-sm font-medium text-[#1a1a1a]/80";

const SUBMIT_COOLDOWN_MS = 5000;

type AccountType = "aday" | "kurumsal";

type AuthedContext = {
  userId: string;
  userType: AccountType;
};

const DELETION_STEPS = [
  "Aşağıdaki formu, hesabınıza kayıtlı bilgilerle doldurun.",
  "Talebiniz ekibimize iletilir; kimliğiniz telefon veya e-posta ile doğrulanır.",
  "Onay sonrası hesabınız, profiliniz ve ilişkili verileriniz kalıcı olarak silinir.",
  "İşlem tamamlandığında e-posta veya SMS ile bilgilendirilirsiniz.",
] as const;

const DELETED_DATA = [
  "Profil bilgileri (ad, fotoğraf, deneyim, konum vb.)",
  "Eşleşmeler, başvurular ve mesajlaşma geçmişi",
  "Beğeni / kaydırma kayıtları",
  "İşveren hesapları için ilanlar ve başvuru verileri",
] as const;

export default function HesapSilmePage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("aday");
  const [message, setMessage] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const [authedContext, setAuthedContext] = useState<AuthedContext | null>(
    null,
  );
  const [isPrefilling, setIsPrefilling] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitCooldown, setSubmitCooldown] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthedContext(null);
        setIsPrefilling(false);
        return;
      }

      try {
        const [userSnap, corporateSnap] = await Promise.all([
          getDoc(doc(db, "users", user.uid)),
          getDoc(doc(db, "corporate_profiles", user.uid)),
        ]);

        const userData = userSnap.exists() ? userSnap.data() : {};
        const corporateData = corporateSnap.exists() ? corporateSnap.data() : {};

        const rawType = String(userData.userType ?? "bireysel");
        const userType: AccountType =
          rawType === "kurumsal" ? "kurumsal" : "aday";

        const displayName =
          typeof corporateData.companyName === "string" &&
          corporateData.companyName.trim()
            ? corporateData.companyName.trim()
            : typeof userData.displayName === "string" &&
                userData.displayName.trim()
              ? userData.displayName.trim()
              : "";

        const profileEmail =
          typeof corporateData.email === "string" && corporateData.email.trim()
            ? corporateData.email.trim()
            : typeof userData.email === "string" && userData.email.trim()
              ? userData.email.trim()
              : user.email?.trim() ?? "";

        setName(displayName);
        setEmail(profileEmail);
        setPhone(user.phoneNumber ?? "");
        setAccountType(userType);
        setAuthedContext({ userId: user.uid, userType });
      } catch (err) {
        console.error("[Account deletion autofill]", err);
        setAuthedContext(
          user ? { userId: user.uid, userType: "aday" } : null,
        );
      } finally {
        setIsPrefilling(false);
      }
    });

    return () => unsubscribe();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName) {
      setError("Lütfen ad soyadınızı girin.");
      return;
    }

    if (!trimmedPhone) {
      setError("Hesabınızı doğrulayabilmemiz için telefon numaranızı girin.");
      return;
    }

    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Geçerli bir e-posta adresi girin.");
      return;
    }

    if (!confirmed) {
      setError("Devam etmek için onay kutusunu işaretleyin.");
      return;
    }

    setIsSubmitting(true);

    try {
      await addDoc(collection(db, "account_deletion_requests"), {
        userId: authedContext?.userId ?? null,
        userType: authedContext?.userType ?? accountType,
        userDisplayName: trimmedName,
        userPhone: trimmedPhone,
        userEmail: trimmedEmail || null,
        message: trimmedMessage || null,
        status: "pending",
        source: "web",
        createdAt: new Date().toISOString(),
      });

      setMessage("");
      setConfirmed(false);
      if (!authedContext) {
        setName("");
        setPhone("");
        setEmail("");
      }
      setSuccessMessage(
        "Hesap silme talebiniz alındı. Kimliğiniz doğrulandıktan sonra hesabınız ve verileriniz silinecektir; süreç hakkında sizi bilgilendireceğiz.",
      );
      setSubmitCooldown(true);
      window.setTimeout(() => setSubmitCooldown(false), SUBMIT_COOLDOWN_MS);
    } catch (err) {
      console.error("[Account deletion request]", err);
      setError("Talep gönderilemedi. Lütfen tekrar deneyin veya destek sayfamızdan bize ulaşın.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="bg-[#f8f9fb] px-6 py-10 sm:px-8 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-600">
            <Trash2 className="size-6" strokeWidth={1.75} aria-hidden />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[#0f2540] sm:text-4xl">
              Hesap Silme
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#1a1a1a]/65 sm:text-base">
              Ekmek hesabınızı ve ilişkili verilerinizi kalıcı olarak silmek
              için bu sayfayı kullanabilirsiniz. Uygulamayı silmiş olsanız bile
              talebinizi web üzerinden iletebilirsiniz.
            </p>
          </div>
        </div>

        <section className="mt-10 space-y-8">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-neutral-200/70 sm:p-8">
            <h2 className="text-lg font-bold text-[#0f2540]">Nasıl çalışır?</h2>
            <ol className="mt-4 space-y-3">
              {DELETION_STEPS.map((step, index) => (
                <li
                  key={step}
                  className="flex gap-3 text-sm leading-relaxed text-[#1a1a1a]/75"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#036AAF]/10 text-xs font-bold text-[#036AAF]">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-neutral-200/70 sm:p-8">
            <h2 className="text-lg font-bold text-[#0f2540]">
              Silinen veriler
            </h2>
            <ul className="mt-4 space-y-2">
              {DELETED_DATA.map((item) => (
                <li
                  key={item}
                  className="flex gap-2 text-sm leading-relaxed text-[#1a1a1a]/75"
                >
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#036AAF]" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm leading-relaxed text-[#1a1a1a]/55">
              Yasal yükümlülükler gereği destek talepleri, fatura kayıtları veya
              güvenlik logları gibi sınırlı veriler belirli süreler boyunca
              saklanabilir; bu süreler sonunda silinir veya anonimleştirilir.
            </p>
          </div>
        </section>

        {isPrefilling ? (
          <div className="mt-10 flex items-center justify-center py-16">
            <Loader2
              className="size-8 animate-spin text-[#036AAF]"
              aria-hidden
            />
          </div>
        ) : (
          <form
            className="mt-10 space-y-5 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-neutral-200/70 sm:p-8"
            onSubmit={(event) => void handleSubmit(event)}
            noValidate
          >
            <div>
              <h2 className="text-lg font-bold text-[#0f2540]">
                Hesap silme talebi
              </h2>
              <p className="mt-1 text-sm text-[#1a1a1a]/55">
                Kayıtlı telefon numaranızı mutlaka girin; hesabınızı bu bilgiyle
                eşleştiriyoruz.
              </p>
            </div>

            <div>
              <label htmlFor="delete-name" className={labelClassName}>
                Ad Soyad
              </label>
              <input
                id="delete-name"
                type="text"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (error) setError(null);
                }}
                disabled={isSubmitting}
                autoComplete="name"
                className={fieldClassName}
                required
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="delete-phone" className={labelClassName}>
                  Telefon
                </label>
                <input
                  id="delete-phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value);
                    if (error) setError(null);
                  }}
                  disabled={isSubmitting}
                  autoComplete="tel"
                  placeholder="+90 5XX XXX XX XX"
                  className={fieldClassName}
                  required
                />
              </div>

              <div>
                <label htmlFor="delete-email" className={labelClassName}>
                  E-posta{" "}
                  <span className="font-normal text-neutral-400">(opsiyonel)</span>
                </label>
                <input
                  id="delete-email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (error) setError(null);
                  }}
                  disabled={isSubmitting}
                  autoComplete="email"
                  className={fieldClassName}
                />
              </div>
            </div>

            {!authedContext ? (
              <div>
                <label htmlFor="delete-account-type" className={labelClassName}>
                  Hesap türü
                </label>
                <select
                  id="delete-account-type"
                  value={accountType}
                  onChange={(event) =>
                    setAccountType(event.target.value as AccountType)
                  }
                  disabled={isSubmitting}
                  className={fieldClassName}
                >
                  <option value="aday">İş arayan (mobil uygulama)</option>
                  <option value="kurumsal">İşveren (web panel)</option>
                </select>
              </div>
            ) : null}

            <div>
              <label htmlFor="delete-message" className={labelClassName}>
                Ek not{" "}
                <span className="font-normal text-neutral-400">(opsiyonel)</span>
              </label>
              <textarea
                id="delete-message"
                rows={3}
                maxLength={1000}
                value={message}
                onChange={(event) => {
                  setMessage(event.target.value);
                  if (error) setError(null);
                }}
                disabled={isSubmitting}
                placeholder="Silme talebinizle ilgili eklemek istediğiniz bir not varsa yazabilirsiniz."
                className={`${fieldClassName} resize-none`}
              />
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-neutral-200/80 bg-[#f8f9fb] px-4 py-4">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => {
                  setConfirmed(event.target.checked);
                  if (error) setError(null);
                }}
                disabled={isSubmitting}
                className="mt-1 size-4 shrink-0 rounded border-neutral-300 text-[#036AAF] focus:ring-[#036AAF]/30"
              />
              <span className="text-sm leading-relaxed text-[#1a1a1a]/75">
                Hesabımın ve ilişkili kişisel verilerimin kalıcı olarak
                silinmesini talep ediyorum. Bu işlemin geri alınamayacağını
                anlıyorum.
              </span>
            </label>

            {error ? (
              <p
                className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            {successMessage ? (
              <p
                className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
                role="status"
              >
                {successMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={
                isSubmitting ||
                submitCooldown ||
                !name.trim() ||
                !phone.trim() ||
                !confirmed
              }
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0f2540] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0a1a2e] disabled:opacity-60 sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Gönderiliyor...
                </>
              ) : (
                "Hesap Silme Talebini Gönder"
              )}
            </button>

            <p className="text-sm text-[#1a1a1a]/55">
              Sorun yaşarsanız{" "}
              <Link href="/destek" className="font-medium text-[#036AAF] hover:underline">
                destek sayfamızdan
              </Link>{" "}
              da bize ulaşabilirsiniz.
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
