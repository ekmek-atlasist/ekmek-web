"use client";

import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, doc, getDoc } from "firebase/firestore";
import { Headphones, Loader2, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  SUPPORT_SUBJECT_OPTIONS,
  type SupportSubjectId,
} from "@/lib/support-subjects";

const fieldClassName =
  "w-full rounded-2xl border border-neutral-200/80 bg-white px-5 py-3.5 text-base text-[#1a1a1a] shadow-sm outline-none transition-shadow placeholder:text-neutral-400 focus:border-[#036AAF]/40 focus:shadow-[0_0_0_3px_rgba(3,106,175,0.12)] disabled:cursor-not-allowed disabled:opacity-60";

const labelClassName = "mb-1.5 block text-sm font-medium text-[#1a1a1a]/80";

const SUBMIT_COOLDOWN_MS = 4000;

type AuthedContext = {
  userId: string;
  userType: string;
};

export default function DestekPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState<SupportSubjectId>("accountIssue");
  const [message, setMessage] = useState("");

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

        const userType = String(userData.userType ?? "bireysel");
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
        setAuthedContext({ userId: user.uid, userType });
      } catch (err) {
        console.error("[Support form autofill]", err);
        setAuthedContext(
          user
            ? { userId: user.uid, userType: "bireysel" }
            : null,
        );
      } finally {
        setIsPrefilling(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!successMessage) return;
    const timer = window.setTimeout(() => setSuccessMessage(null), 5000);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName) {
      setError("Lütfen ad soyadınızı girin.");
      return;
    }

    if (!trimmedEmail) {
      setError("Lütfen e-posta adresinizi girin.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Geçerli bir e-posta adresi girin.");
      return;
    }

    if (!trimmedMessage) {
      setError("Lütfen mesajınızı yazın.");
      return;
    }

    if (trimmedMessage.length > 5000) {
      setError("Mesaj en fazla 5000 karakter olabilir.");
      return;
    }

    setIsSubmitting(true);

    try {
      await addDoc(collection(db, "support_tickets"), {
        userId: authedContext?.userId ?? null,
        userType: authedContext?.userType ?? null,
        userEmail: trimmedEmail,
        userPhone: trimmedPhone || null,
        userDisplayName: trimmedName,
        subject,
        message: trimmedMessage,
        imageUrl: null,
        status: "pending",
        createdAt: new Date().toISOString(),
      });

      setMessage("");
      if (!authedContext) {
        setName("");
        setEmail("");
        setPhone("");
      }
      setSubject("accountIssue");
      setSuccessMessage(
        "Talebiniz alındı, en kısa sürede e-posta ile dönüş yapacağız.",
      );
      setSubmitCooldown(true);
      window.setTimeout(() => setSubmitCooldown(false), SUBMIT_COOLDOWN_MS);
    } catch (err) {
      console.error("[Support ticket submit]", err);
      setError("Talep gönderilemedi. Lütfen tekrar dene.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="bg-[#f8f9fb] px-6 py-10 sm:px-8 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#036AAF]/10 text-[#036AAF]">
            <Headphones className="size-6" strokeWidth={1.75} aria-hidden />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[#0f2540] sm:text-4xl">
              Destek
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#1a1a1a]/65 sm:text-base">
              Sorun, öneri veya geri bildirimlerinizi bize iletin. Ekibimiz en
              kısa sürede e-posta ile dönüş yapar.
            </p>
          </div>
        </div>

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
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="support-name" className={labelClassName}>
                  Ad Soyad
                </label>
                <input
                  id="support-name"
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

              <div>
                <label htmlFor="support-email" className={labelClassName}>
                  E-posta
                </label>
                <input
                  id="support-email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (error) setError(null);
                  }}
                  disabled={isSubmitting}
                  autoComplete="email"
                  className={fieldClassName}
                  required
                />
              </div>

              <div>
                <label htmlFor="support-phone" className={labelClassName}>
                  Telefon{" "}
                  <span className="font-normal text-neutral-400">(opsiyonel)</span>
                </label>
                <input
                  id="support-phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value);
                    if (error) setError(null);
                  }}
                  disabled={isSubmitting}
                  autoComplete="tel"
                  className={fieldClassName}
                />
              </div>
            </div>

            <div>
              <label htmlFor="support-subject" className={labelClassName}>
                Konu
              </label>
              <select
                id="support-subject"
                value={subject}
                onChange={(event) =>
                  setSubject(event.target.value as SupportSubjectId)
                }
                disabled={isSubmitting}
                className={fieldClassName}
              >
                {SUPPORT_SUBJECT_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="support-message" className={labelClassName}>
                Mesaj
              </label>
              <textarea
                id="support-message"
                rows={6}
                maxLength={5000}
                value={message}
                onChange={(event) => {
                  setMessage(event.target.value);
                  if (error) setError(null);
                }}
                disabled={isSubmitting}
                placeholder="Sorununuzu veya önerinizi detaylıca yazın"
                className={`${fieldClassName} resize-none`}
                required
              />
              <p className="mt-1.5 text-right text-xs text-neutral-400">
                {message.length}/5000
              </p>
            </div>

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
                !email.trim() ||
                !message.trim()
              }
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#036AAF] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#025a94] disabled:opacity-60 sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <Send className="size-4" aria-hidden />
                  Gönder
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
