"use client";

import type { ReactNode } from "react";
import {
  APP_STORE_URL,
  GOOGLE_PLAY_URL,
} from "@/lib/app-store-links";

function AppleLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
      role="presentation"
      fill="currentColor"
    >
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function GooglePlayLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
      role="presentation"
    >
      <path
        fill="#4285F4"
        d="M3.6 1.8c-.3.2-.5.6-.5 1v18.4c0 .4.2.8.5 1l.1.1 10.3-10.3v-.2L3.7 1.7l-.1.1z"
      />
      <path
        fill="#34A853"
        d="M16.8 8.4 13.7 11.5l3.1 3.1 5.2-2.9c.9-.5.9-1.3 0-1.8l-5.2-2.5z"
      />
      <path
        fill="#FBBC04"
        d="M13.7 12.5 16.8 9.4 6.5 2.1l7.2 7.2z"
      />
      <path
        fill="#EA4335"
        d="M6.5 21.9l10.3-7.3-3.1-3.1-7.2 7.2z"
      />
    </svg>
  );
}

type BadgeShellProps = {
  href: string;
  label: string;
  children: ReactNode;
  compact?: boolean;
  theme?: "dark" | "light";
};

function BadgeShell({
  href,
  label,
  children,
  compact = false,
  theme = "dark",
}: BadgeShellProps) {
  const ringClass =
    theme === "dark"
      ? "ring-white/12 hover:ring-white/28 hover:shadow-[0_8px_28px_rgba(0,0,0,0.35)]"
      : "ring-black/[0.08] hover:ring-black/15 hover:shadow-md";

  const className = [
    "group inline-flex w-full items-center gap-3 rounded-xl bg-[#0a0a0a] text-white",
    "ring-1 transition-all duration-200 ease-out",
    "hover:-translate-y-0.5 hover:bg-[#141414]",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#036AAF]",
    ringClass,
    compact ? "min-h-[44px] px-3.5 py-2" : "min-h-[52px] px-4 py-2.5",
  ].join(" ");

  if (!href) {
    return (
      <div aria-disabled="true" className={`${className} cursor-default opacity-50`}>
        {children}
      </div>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={className}
    >
      {children}
    </a>
  );
}

function AppStoreBadge({
  compact,
  theme,
}: {
  compact?: boolean;
  theme?: "dark" | "light";
}) {
  return (
    <BadgeShell
      href={APP_STORE_URL}
      label="App Store'dan indir"
      compact={compact}
      theme={theme}
    >
      <AppleLogo
        className={`shrink-0 text-white ${compact ? "size-[22px]" : "size-[26px]"}`}
      />
      <span className="min-w-0 text-left leading-none">
        <span
          className={`block font-normal text-white/75 ${
            compact ? "text-[10px]" : "text-[11px]"
          }`}
        >
          Download on the
        </span>
        <span
          className={`mt-0.5 block font-semibold tracking-tight text-white ${
            compact ? "text-[15px]" : "text-base"
          }`}
        >
          App Store
        </span>
      </span>
    </BadgeShell>
  );
}

function GooglePlayBadge({
  compact,
  theme,
}: {
  compact?: boolean;
  theme?: "dark" | "light";
}) {
  return (
    <BadgeShell
      href={GOOGLE_PLAY_URL}
      label="Google Play'den indir"
      compact={compact}
      theme={theme}
    >
      <GooglePlayLogo
        className={`shrink-0 ${compact ? "size-[22px]" : "size-[26px]"}`}
      />
      <span className="min-w-0 text-left leading-none">
        <span
          className={`block font-normal text-white/75 ${
            compact ? "text-[10px]" : "text-[11px]"
          }`}
        >
          GET IT ON
        </span>
        <span
          className={`mt-0.5 block font-semibold tracking-tight text-white ${
            compact ? "text-[15px]" : "text-base"
          }`}
        >
          Google Play
        </span>
      </span>
    </BadgeShell>
  );
}

type AppStoreButtonsProps = {
  layout?: "row" | "column";
  align?: "center" | "start";
  compact?: boolean;
  theme?: "dark" | "light";
  className?: string;
};

export function AppStoreButtons({
  layout = "row",
  align = "center",
  compact = false,
  theme = "dark",
  className = "",
}: AppStoreButtonsProps) {
  const widthClass = layout === "column" ? "max-w-[240px]" : "max-w-[440px]";
  const alignClass = align === "center" ? "mx-auto" : "mr-auto";
  const directionClass =
    layout === "column"
      ? "flex-col gap-2.5"
      : "flex-col gap-2.5 sm:flex-row sm:gap-3";

  return (
    <div
      className={`flex w-full ${widthClass} ${alignClass} ${directionClass} ${className}`.trim()}
    >
      <AppStoreBadge compact={compact} theme={theme} />
      <GooglePlayBadge compact={compact} theme={theme} />
    </div>
  );
}
