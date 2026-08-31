"use client";

import { FirebaseError } from "firebase/app";
import { signInWithCustomToken, signOut } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { doc, getDoc } from "firebase/firestore";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { Check, Loader2, Smartphone, UserRoundX } from "lucide-react";
import {
  digitsOnly,
  formatPhoneForDisplay,
  formatPhoneInput,
  getLoginErrorMessage,
  isValidOtpCode,
  isValidPhoneDigits,
} from "@/lib/auth/login-helpers";
import {
  clearVerifiedPhoneE164,
  storeVerifiedPhoneE164,
} from "@/lib/auth/verified-phone";
import { auth, db, functions } from "@/lib/firebase";

type Stage = "phone" | "otp" | "redirecting" | "bireysel";

type UserDoc = {
  userType?: string;
};

type OtpMode = "login" | "register";

type SendOtpResponse = {
  success: boolean;
  expiresInSeconds: number;
};

type VerifyOtpResponse = {
  token: string;
  uid: string;
  mode: OtpMode;
};

export type LoginFormMode = "login" | "register";

type LoginFormProps = {
  mode?: LoginFormMode;
  formIdPrefix?: string;
  className?: string;
  onComplete?: () => void;
};

function OtpBoxes({
  value,
  onChange,
  disabled,
  idPrefix,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  idPrefix: string;
}) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(6, " ").slice(0, 6).split("");

  function focusIndex(index: number) {
    inputRefs.current[index]?.focus();
  }

  function handleDigitChange(index: number, raw: string) {
    const digit = digitsOnly(raw, 1);
    const next = value.split("");
    next[index] = digit;
    const joined = next.join("").slice(0, 6);
    onChange(joined);

    if (digit && index < 5) {
      focusIndex(index + 1);
    }
  }

  function handleKeyDown(
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Backspace" && !digits[index]?.trim() && index > 0) {
      focusIndex(index - 1);
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = digitsOnly(event.clipboardData.getData("text"), 6);
    if (pasted) {
      onChange(pasted);
      focusIndex(Math.min(pasted.length, 5));
    }
  }

  return (
    <div className="flex justify-center gap-1.5 sm:gap-2">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          id={`${idPrefix}-${index}`}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digit.trim()}
          disabled={disabled}
          onChange={(event) => handleDigitChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          className="size-10 rounded-lg border border-neutral-200 bg-white text-center text-base font-semibold text-[#1a1a1a] outline-none transition-colors focus:border-[#036AAF] disabled:opacity-60 sm:size-11"
        />
      ))}
    </div>
  );
}

function TurkishFlagIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 16"
      className={className}
      aria-hidden
      role="presentation"
    >
      <rect width="24" height="16" rx="2" fill="#E30A17" />
      <circle cx="9.2" cy="8" r="3.6" fill="#fff" />
      <circle cx="10.3" cy="8" r="2.9" fill="#E30A17" />
      <path
        fill="#fff"
        d="M15.8 8 14.1 8.6l.5-1.7-1.3 1.3h-1.7l1.3 1-0.5-1.7 1.7 1.2-1.7-0.2 1.3 1.3z"
      />
    </svg>
  );
}

function PhoneNumberField({
  id,
  digits,
  onChange,
  disabled,
  valid,
}: {
  id: string;
  digits: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  valid: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const formattedValue = formatPhoneInput(digits);

  function handleChange(rawValue: string) {
    const nextDigits = digitsOnly(rawValue, 10);
    onChange(nextDigits);

    requestAnimationFrame(() => {
      const input = inputRef.current;
      if (!input) return;
      const nextFormatted = formatPhoneInput(nextDigits);
      input.setSelectionRange(nextFormatted.length, nextFormatted.length);
    });
  }

  return (
    <div
      className={`rounded-2xl border transition-colors ${
        valid
          ? "border-emerald-300 bg-emerald-50/30"
          : "border-neutral-200 bg-[#f8f9fb] focus-within:border-[#036AAF]/50 focus-within:bg-white"
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3.5 sm:px-5 sm:py-4">
        <div className="flex shrink-0 items-center gap-2 rounded-xl bg-white px-2.5 py-2 shadow-sm ring-1 ring-black/[0.04]">
          <TurkishFlagIcon className="h-3.5 w-5 shrink-0 rounded-[2px]" />
          <span className="text-sm font-bold text-[#0f2540]">+90</span>
        </div>

        <input
          ref={inputRef}
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="5XX XXX XX XX"
          value={formattedValue}
          onChange={(event) => handleChange(event.target.value)}
          disabled={disabled}
          aria-label="Telefon numarası"
          className="min-w-0 flex-1 bg-transparent text-lg font-semibold tracking-[0.12em] text-[#0f2540] outline-none placeholder:font-normal placeholder:tracking-[0.08em] placeholder:text-neutral-300 disabled:opacity-60 sm:text-xl"
        />

        {valid ? (
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
            <Check className="size-4" strokeWidth={2.5} aria-hidden />
          </span>
        ) : null}
      </div>
    </div>
  );
}

function AuthHero({
  mode,
  stage,
}: {
  mode: LoginFormMode;
  stage: Stage;
}) {
  const title =
    stage === "bireysel"
      ? "Farklı hesap türü"
      : stage === "otp"
        ? "Doğrulama Kodu"
        : mode === "register"
          ? "İşveren Kaydı"
          : "İşveren Girişi";

  const subtitle =
    stage === "bireysel"
      ? "Bu alan yalnızca işveren hesapları içindir"
      : stage === "otp"
        ? "SMS ile gelen kodu gir"
        : mode === "register"
          ? "Telefon numaranı doğrula"
          : "Telefon numaranla giriş yap";

  return (
    <div className="relative overflow-visible rounded-t-2xl bg-[#0f2540] px-5 pt-5 pb-8 sm:px-6 sm:pt-6 sm:pb-10">
      <div className="relative z-[1] max-w-[62%]">
        <h2 className="text-xl font-bold tracking-tight text-white sm:text-[1.35rem]">
          {title}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-white/65">{subtitle}</p>
      </div>

      <div className="pointer-events-none absolute -right-1 -bottom-7 z-[2] size-[7.5rem] sm:-right-2 sm:-bottom-8 sm:size-[8.75rem]">
        <Image
          src="/auth-mascot.png"
          alt=""
          width={140}
          height={140}
          className="size-full object-contain object-bottom drop-shadow-[0_16px_28px_rgba(0,0,0,0.35)]"
          priority
        />
      </div>
    </div>
  );
}

function logAuthError(scope: string, err: unknown) {
  if (err instanceof FirebaseError) {
    console.error(`[${scope}]`, err.code, err.message, err);
    return;
  }
  console.error(`[${scope}]`, err);
}

export function LoginForm({
  mode = "login",
  formIdPrefix = "login-form",
  className = "",
  onComplete,
}: LoginFormProps) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("phone");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [otpSessionActive, setOtpSessionActive] = useState(false);

  const phoneValid = isValidPhoneDigits(phoneDigits);
  const otpValid = isValidOtpCode(otpCode);
  const phoneE164 = phoneValid ? `+90${phoneDigits}` : "";

  async function handleSendCode() {
    setError(null);

    if (!phoneValid) {
      setError("Geçerli bir cep telefonu numarası gir (5XX XXX XX XX).");
      return;
    }

    setIsSending(true);

    try {
      const sendOtp = httpsCallable<
        { e164: string; mode: OtpMode },
        SendOtpResponse
      >(functions, "sendOtp");

      await sendOtp({ e164: phoneE164, mode });

      setOtpCode("");
      setOtpSessionActive(true);
      setStage("otp");
    } catch (err) {
      logAuthError("OTP send", err);
      setError(getLoginErrorMessage(err));
    } finally {
      setIsSending(false);
    }
  }

  async function handleVerifyCode() {
    setError(null);

    if (!otpValid) {
      setError("Lütfen 6 haneli kodu gir.");
      return;
    }

    if (!otpSessionActive || !phoneE164) {
      setError("Doğrulama oturumu bulunamadı. Lütfen tekrar kod iste.");
      setStage("phone");
      return;
    }

    setIsVerifying(true);

    try {
      const verifyOtp = httpsCallable<
        { e164: string; code: string },
        VerifyOtpResponse
      >(functions, "verifyOtp");

      const result = await verifyOtp({ e164: phoneE164, code: otpCode });
      const { token, uid } = result.data;

      storeVerifiedPhoneE164(phoneE164);
      await signInWithCustomToken(auth, token);

      setIsVerifying(false);
      setStage("redirecting");
      setError(null);

      const resolvedUid = auth.currentUser?.uid ?? uid;

      try {
        const userDoc = await getDoc(doc(db, "users", resolvedUid));

        if (!userDoc.exists()) {
          onComplete?.();
          router.push("/isveren/kayit");
          return;
        }

        const data = userDoc.data() as UserDoc;

        if (data.userType === "kurumsal") {
          onComplete?.();
          router.push("/isveren/panel");
          return;
        }

        if (data.userType === "bireysel") {
          setStage("bireysel");
          return;
        }

        setError("Bir hata oluştu, tekrar dene");
      } catch (err) {
        console.error("[Phone OTP post-auth Firestore]", err);
        setError("Bir hata oluştu, tekrar dene");
      }
    } catch (err) {
      logAuthError("OTP verify", err);
      setError(getLoginErrorMessage(err));
      setIsVerifying(false);
    }
  }

  async function handleSignOut() {
    setIsSigningOut(true);
    setError(null);

    try {
      await signOut(auth);
      clearVerifiedPhoneE164();
      setPhoneDigits("");
      setOtpCode("");
      setOtpSessionActive(false);
      setStage("phone");
    } catch {
      setError("Çıkış yapılamadı. Lütfen tekrar dene.");
    } finally {
      setIsSigningOut(false);
    }
  }

  function handleChangeNumber() {
    setError(null);
    setOtpCode("");
    setOtpSessionActive(false);
    setStage("phone");
  }

  return (
    <div className={className}>
      {stage === "phone" || stage === "otp" || stage === "bireysel" ? (
        <AuthHero mode={mode} stage={stage} />
      ) : null}

      <div
        className={
          stage === "phone" || stage === "otp"
            ? "px-5 pb-5 pt-4 sm:px-6 sm:pb-6"
            : undefined
        }
      >
      {stage === "phone" ? (
        <div>
          <label
            htmlFor={`phone-${formIdPrefix}`}
            className="mb-2.5 block text-sm font-medium text-[#1a1a1a]/70"
          >
            Cep telefonu
          </label>

          <PhoneNumberField
            id={`phone-${formIdPrefix}`}
            digits={phoneDigits}
            valid={phoneValid}
            disabled={isSending}
            onChange={(next) => {
              setPhoneDigits(next);
              if (error) setError(null);
            }}
          />

          {error ? (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => void handleSendCode()}
            disabled={isSending || !phoneValid}
            className="mt-5 w-full rounded-xl bg-[#036AAF] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#025a94] disabled:opacity-45"
          >
            {isSending ? "Gönderiliyor..." : "Kod Gönder"}
          </button>
        </div>
      ) : null}

      {stage === "otp" ? (
        <div>
          <p className="text-sm text-[#1a1a1a]/65">
            <span className="font-semibold text-[#0f2540]">
              {formatPhoneForDisplay(phoneDigits)}
            </span>
            {" "}numarasına kod gönderildi.
          </p>

          <div className="relative mt-4">
            <OtpBoxes
              idPrefix={`otp-${formIdPrefix}`}
              value={otpCode}
              onChange={(next) => {
                setOtpCode(next);
                if (error) setError(null);
              }}
              disabled={isVerifying}
            />
            {otpValid ? (
              <div className="mt-2 flex justify-center">
                <Check
                  className="size-5 text-emerald-500"
                  strokeWidth={2.5}
                  aria-hidden
                />
              </div>
            ) : null}
          </div>

          {error ? (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => void handleVerifyCode()}
            disabled={isVerifying || !otpValid}
            className="mt-5 w-full rounded-xl bg-[#036AAF] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#025a94] disabled:opacity-45"
          >
            {isVerifying ? "Doğrulanıyor..." : "Doğrula"}
          </button>

          <button
            type="button"
            onClick={handleChangeNumber}
            disabled={isVerifying}
            className="mt-3 w-full text-sm text-[#036AAF] transition-colors hover:text-[#025a94] disabled:opacity-60"
          >
            Numarayı değiştir
          </button>
        </div>
      ) : null}
      </div>

      {stage === "redirecting" ? (
        <div className="py-8 text-center">
          {error ? (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : (
            <>
              <Loader2
                className="mx-auto size-8 animate-spin text-[#036AAF]"
                aria-hidden
              />
              <p className="mt-4 text-xl font-bold text-[#1a1a1a]">
                Yönlendiriliyor...
              </p>
              <p className="mt-2 text-sm text-[#1a1a1a]/70">
                Hesabın kontrol ediliyor.
              </p>
            </>
          )}
        </div>
      ) : null}

      {stage === "bireysel" ? (
        <div className="px-5 pb-6 pt-5 sm:px-6">
          <div className="rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50 to-orange-50/40 p-4 sm:p-5">
            <div className="flex gap-3.5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 ring-1 ring-amber-200/80">
                <UserRoundX className="size-5" strokeWidth={2.25} aria-hidden />
              </span>
              <div className="min-w-0 pt-0.5">
                <h3 className="text-base font-bold leading-snug text-[#0f2540] sm:text-[1.05rem]">
                  Bu panel işverenler için
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[#1a1a1a]/70">
                  <span className="font-medium text-[#0f2540]">
                    {formatPhoneForDisplay(phoneDigits)}
                  </span>
                  {" "}numarası bireysel (iş arayan) hesap olarak kayıtlı.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-3 rounded-2xl border border-neutral-200/80 bg-[#f8f9fb] p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#036AAF] shadow-sm ring-1 ring-black/[0.04]">
              <Smartphone className="size-5" strokeWidth={2} aria-hidden />
            </span>
            <p className="text-sm leading-relaxed text-[#1a1a1a]/70">
              İş aramak ve başvuru yapmak için{" "}
              <span className="font-semibold text-[#0f2540]">Ekmek mobil uygulamasını</span>{" "}
              kullanabilirsin.
            </p>
          </div>

          {error ? (
            <p
              className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => void handleSignOut()}
            disabled={isSigningOut}
            className="mt-5 w-full rounded-xl bg-[#036AAF] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#025a94] disabled:opacity-60"
          >
            {isSigningOut ? "Çıkış yapılıyor..." : "Çıkış Yap"}
          </button>

          <p className="mt-3 text-center text-xs leading-relaxed text-[#1a1a1a]/45">
            İşveren hesabın varsa farklı bir numara ile tekrar giriş yap.
          </p>
        </div>
      ) : null}
    </div>
  );
}
