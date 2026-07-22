"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import {
  isPanelNavActive,
  PANEL_NAV_ITEMS,
} from "@/lib/panel-nav";
import { GLOBAL_HEADER_HEIGHT_PX } from "@/lib/layout-constants";

type PanelHeaderNavProps = {
  companyName: string;
  logoUrl: string | null;
  isSigningOut: boolean;
  onSignOut: () => void;
};

function CompanyAvatar({
  companyName,
  logoUrl,
}: {
  companyName: string;
  logoUrl: string | null;
}) {
  const initial = (companyName.trim()[0] ?? "Ş").toUpperCase();

  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt=""
        className="size-8 rounded-full object-cover ring-2 ring-white/20"
      />
    );
  }

  return (
    <div className="flex size-8 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white ring-2 ring-white/20">
      {initial}
    </div>
  );
}

export function PanelHeaderNav({
  companyName,
  logoUrl,
  isSigningOut,
  onSignOut,
}: PanelHeaderNavProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const activeItem =
    PANEL_NAV_ITEMS.find(({ href, exact }) =>
      isPanelNavActive(pathname, href, exact),
    ) ?? PANEL_NAV_ITEMS[0];

  return (
    <>
      <nav
        className="hidden min-w-0 flex-1 items-center justify-center xl:flex"
        aria-label="Panel menüsü"
      >
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
          {PANEL_NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const active = isPanelNavActive(pathname, href, exact);
            return (
              <Link
                key={href}
                href={href}
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#036AAF] text-white shadow-sm"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="hidden min-w-0 flex-1 items-center justify-center md:flex xl:hidden">
        <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-white/10 bg-white/5 p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {PANEL_NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const active = isPanelNavActive(pathname, href, exact);
            return (
              <Link
                key={href}
                href={href}
                title={label}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#036AAF] text-white shadow-sm"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
                <span className="hidden lg:inline">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="hidden items-center gap-2 sm:flex">
          <CompanyAvatar companyName={companyName} logoUrl={logoUrl} />
          <span className="hidden max-w-[140px] truncate text-sm font-semibold text-white md:inline lg:max-w-[180px]">
            {companyName}
          </span>
        </div>

        <button
          type="button"
          onClick={onSignOut}
          disabled={isSigningOut}
          className="hidden rounded-full border border-white/25 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10 disabled:opacity-60 sm:inline-flex"
        >
          {isSigningOut ? "Çıkış..." : "Çıkış Yap"}
        </button>

        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 md:hidden"
          aria-expanded={mobileOpen}
          aria-label="Panel menüsünü aç"
        >
          <Menu className="size-4" />
          <span className="max-w-[88px] truncate">{activeItem.label}</span>
          <ChevronDown
            className={`size-4 transition-transform ${mobileOpen ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
      </div>

      {mobileOpen ? (
        <>
          <button
            type="button"
            aria-label="Menüyü kapat"
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            style={{ top: GLOBAL_HEADER_HEIGHT_PX }}
            onClick={() => setMobileOpen(false)}
          />
          <div
            className="fixed inset-x-0 z-50 border-b border-white/10 bg-[#0f2540]/95 px-4 py-4 backdrop-blur-xl md:hidden"
            style={{ top: GLOBAL_HEADER_HEIGHT_PX }}
          >
            <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <CompanyAvatar companyName={companyName} logoUrl={logoUrl} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {companyName}
                  </p>
                  <p className="text-xs text-white/50">İşveren Alanı</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-2 text-white/70 hover:bg-white/10"
                aria-label="Menüyü kapat"
              >
                <X className="size-5" />
              </button>
            </div>

            <nav className="grid gap-1" aria-label="Panel menüsü">
              {PANEL_NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
                const active = isPanelNavActive(pathname, href, exact);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                      active
                        ? "bg-[#036AAF] text-white"
                        : "text-white/80 hover:bg-white/10"
                    }`}
                  >
                    <Icon className="size-5 shrink-0" strokeWidth={1.75} aria-hidden />
                    {label}
                  </Link>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={onSignOut}
              disabled={isSigningOut}
              className="mt-4 w-full rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 disabled:opacity-60"
            >
              {isSigningOut ? "Çıkış yapılıyor..." : "Çıkış Yap"}
            </button>
          </div>
        </>
      ) : null}
    </>
  );
}
