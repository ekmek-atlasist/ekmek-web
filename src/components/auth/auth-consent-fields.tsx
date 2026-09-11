"use client";

import { useState, type ReactNode } from "react";
import { AuthLegalSheet, type AuthLegalSheetType } from "./auth-legal-sheet";

type AuthConsentFieldsProps = {
  idPrefix: string;
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  marketingConsent: boolean;
  onAcceptedTermsChange: (value: boolean) => void;
  onAcceptedPrivacyChange: (value: boolean) => void;
  onMarketingConsentChange: (value: boolean) => void;
  disabled?: boolean;
};

function ConsentCheckbox({
  id,
  checked,
  onChange,
  disabled,
  children,
}: {
  id: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 transition-colors ${
        checked
          ? "border-[#036AAF]/25 bg-[#036AAF]/[0.04]"
          : "border-neutral-200/80 bg-[#f8f9fb]/80 hover:border-neutral-300"
      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
        className="mt-0.5 size-4 shrink-0 rounded border-neutral-300 text-[#036AAF] focus:ring-[#036AAF]/30"
      />
      <span className="text-sm leading-relaxed text-[#1a1a1a]/75">{children}</span>
    </label>
  );
}

function LegalLinkButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
      className="font-semibold text-[#036AAF] underline-offset-2 hover:underline"
    >
      {children}
    </button>
  );
}

export function AuthConsentFields({
  idPrefix,
  acceptedTerms,
  acceptedPrivacy,
  marketingConsent,
  onAcceptedTermsChange,
  onAcceptedPrivacyChange,
  onMarketingConsentChange,
  disabled,
}: AuthConsentFieldsProps) {
  const [legalSheet, setLegalSheet] = useState<AuthLegalSheetType | null>(null);

  return (
    <>
      <div className="mt-5 space-y-2.5">
        <ConsentCheckbox
          id={`${idPrefix}-terms`}
          checked={acceptedTerms}
          onChange={onAcceptedTermsChange}
          disabled={disabled}
        >
          <LegalLinkButton onClick={() => setLegalSheet("terms")}>
            Kullanım Şartları ve Üyelik Sözleşmesi
          </LegalLinkButton>
          &apos;ni okudum, kabul ediyorum.
        </ConsentCheckbox>

        <ConsentCheckbox
          id={`${idPrefix}-privacy`}
          checked={acceptedPrivacy}
          onChange={onAcceptedPrivacyChange}
          disabled={disabled}
        >
          <LegalLinkButton onClick={() => setLegalSheet("privacy")}>
            Aydınlatma Metni
          </LegalLinkButton>
          &apos;ni okudum, anladım.
        </ConsentCheckbox>

        <ConsentCheckbox
          id={`${idPrefix}-marketing`}
          checked={marketingConsent}
          onChange={onMarketingConsentChange}
          disabled={disabled}
        >
          Ticari elektronik ileti almak istiyorum.{" "}
          <span className="text-[#1a1a1a]/45">(isteğe bağlı)</span>
        </ConsentCheckbox>
      </div>

      <AuthLegalSheet
        open={legalSheet !== null}
        type={legalSheet}
        onClose={() => setLegalSheet(null)}
      />
    </>
  );
}

export function isAuthConsentComplete(
  acceptedTerms: boolean,
  acceptedPrivacy: boolean,
): boolean {
  return acceptedTerms && acceptedPrivacy;
}
