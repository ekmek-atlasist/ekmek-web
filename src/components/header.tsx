"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, LogIn, UserPlus } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuthModal } from "@/components/auth/auth-modal";
import { PanelHeaderNav } from "@/components/panel/panel-header-nav";
import { useOptionalPanelHeader } from "@/components/panel/panel-header-context";

export default function Header() {
  const pathname = usePathname();
  const { openAuthModal } = useAuthModal();
  const panelHeaderContext = useOptionalPanelHeader();
  const panelHeader = panelHeaderContext?.panelHeader ?? null;
  const menuRef = useRef<HTMLDivElement>(null);

  const [scrolled, setScrolled] = useState(false);
  const [employerMenuOpen, setEmployerMenuOpen] = useState(false);

  const isPanel = pathname.startsWith("/isveren/panel");
  const showEmployerActions = !isPanel;

  const headerBackground = scrolled
    ? "bg-[#0f2540]/82"
    : "bg-[#0f2540]/52";

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setEmployerMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!employerMenuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setEmployerMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setEmployerMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [employerMenuOpen]);

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-50 flex h-[72px] w-full items-center border-b border-white/10 px-4 backdrop-blur-xl transition-[background-color] duration-300 ease-out sm:px-6 md:px-8 lg:px-10 ${headerBackground} ${
        isPanel && panelHeader ? "gap-3 lg:gap-4" : "justify-between"
      }`}
    >
      <Link
        href={isPanel ? "/isveren/panel" : "/"}
        className="flex min-w-0 shrink-0 items-center gap-2"
      >
        <Image
          src="/ekmek_icon.svg"
          alt="ekmek"
          width={56}
          height={56}
          className={`shrink-0 rounded-xl ${isPanel ? "size-11 sm:size-12" : "size-14"}`}
          priority
        />
        <span className="truncate text-lg font-bold sm:text-xl">
          <span className="text-white">ekmekisbul</span>
          <span className="text-[#036AAF]">.com</span>
        </span>
      </Link>

      {isPanel && panelHeader ? (
        <PanelHeaderNav
          companyName={panelHeader.companyName}
          logoUrl={panelHeader.logoUrl}
          isSigningOut={panelHeader.isSigningOut}
          onSignOut={panelHeader.onSignOut}
        />
      ) : null}

      {!isPanel && showEmployerActions ? (
        <div className="flex shrink-0 items-center gap-3">
          <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setEmployerMenuOpen((open) => !open)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  employerMenuOpen
                    ? "border-white/30 bg-white/15 text-white"
                    : "border-[#036AAF]/60 bg-[#036AAF] text-white hover:bg-[#025a94]"
                }`}
                aria-expanded={employerMenuOpen}
                aria-haspopup="menu"
              >
                İşveren Girişi
                <ChevronDown
                  className={`size-4 transition-transform duration-200 ${employerMenuOpen ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>

              {employerMenuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 z-50 mt-3 w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#0f2540]/95 p-2 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setEmployerMenuOpen(false);
                      openAuthModal("login");
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-medium text-white transition-colors hover:bg-white/10"
                  >
                    <span className="flex size-9 items-center justify-center rounded-full bg-[#036AAF]/30 text-[#7ec8ff]">
                      <LogIn className="size-4" aria-hidden />
                    </span>
                    <span>
                      <span className="block font-semibold">Giriş Yap</span>
                      <span className="block text-xs text-white/55">
                        Mevcut işveren hesabı
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setEmployerMenuOpen(false);
                      openAuthModal("register");
                    }}
                    className="mt-1 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-medium text-white transition-colors hover:bg-white/10"
                  >
                    <span className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white">
                      <UserPlus className="size-4" aria-hidden />
                    </span>
                    <span>
                      <span className="block font-semibold">Kayıt Ol</span>
                      <span className="block text-xs text-white/55">
                        Yeni işveren hesabı aç
                      </span>
                    </span>
                  </button>
                </div>
              ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}
