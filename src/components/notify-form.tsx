"use client";

import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { CheckCircle } from "lucide-react";
import { db } from "../lib/firebase";

const COLLECTION = "newsletter_subscribers";

function isValidEmail(raw: string): boolean {
  const email = raw.trim();
  if (!email || /\s/.test(email)) return false;
  if (!email.includes("@") || !email.includes(".")) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

type FormStatus = "idle" | "loading" | "success" | "error";

export function NotifyForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [validationError, setValidationError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setValidationError(null);

    if (!isValidEmail(email)) {
      setValidationError("Geçerli bir e-posta adresi girin");
      return;
    }

    setStatus("loading");
    const normalized = email.trim().toLowerCase();

    try {
      await addDoc(collection(db, COLLECTION), {
        email: normalized,
        createdAt: serverTimestamp(),
        source: "landing_page",
      });
      setStatus("success");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="mt-6 flex flex-col items-center justify-center gap-4 text-center sm:mt-8 md:mt-10">
        <CheckCircle
          className="size-16 text-white sm:size-20"
          strokeWidth={1.5}
          aria-hidden
        />
        <p className="max-w-md text-lg leading-relaxed text-white/90">
          Teşekkürler! Yayına çıktığımızda sana haber vereceğiz.
        </p>
      </div>
    );
  }

  return (
    <form
      className="mt-6 flex w-full max-w-2xl flex-col gap-3 sm:mt-8 md:mt-10"
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-center sm:gap-3">
        <div className="flex w-full min-w-0 flex-1 flex-col sm:max-w-md">
          <label htmlFor="notify-email" className="sr-only">
            E-posta
          </label>
          <input
            id="notify-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="ornek@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (validationError) setValidationError(null);
            }}
            disabled={status === "loading"}
            className="w-full min-w-0 rounded-full border-0 bg-white px-5 py-3 text-base text-[#1A1A1A] shadow-sm outline-none ring-2 ring-transparent placeholder:text-neutral-400 focus:ring-white/40 disabled:opacity-60 md:px-6 md:py-3.5"
          />
          {validationError ? (
            <p className="mt-2 text-left text-sm text-red-300 sm:px-1">
              {validationError}
            </p>
          ) : null}
        </div>
        <button
          type="submit"
          disabled={status === "loading"}
          className="shrink-0 rounded-full bg-black px-6 py-3 text-base font-semibold text-white shadow-sm transition-transform duration-200 hover:scale-[1.03] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60 md:px-8 md:py-3.5"
        >
          {status === "loading" ? "Gönderiliyor..." : "Haberdar Et"}
        </button>
      </div>
      {status === "error" ? (
        <p className="text-center text-sm text-red-400">
          Bir hata oluştu, lütfen tekrar dene.
        </p>
      ) : null}
    </form>
  );
}
