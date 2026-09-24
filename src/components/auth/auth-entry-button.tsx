"use client";

import { ChevronDown, LogIn, UserPlus } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuthModal } from "@/components/auth/auth-modal";
import { EmployerMobileNoticeModal } from "@/components/landing/employer-mobile-notice-modal";
import { useIsMobile } from "@/hooks/use-is-mobile";

type AuthEntryButtonProps = {
  label?: string;
  size?: "md" | "lg";
};

export function AuthEntryButton({
  label = "Giriş",
  size = "md",
}: AuthEntryButtonProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { openAuthModal } = useAuthModal();
  const menuRef = useRef<HTMLDivElement>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNoticeOpen, setMobileNoticeOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
    setMobileNoticeOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  const triggerSizeClass =
    size === "lg" ? "px-6 py-3 text-sm sm:text-base" : "px-4 py-2.5 text-sm";

  return (
    <>
      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => {
            if (isMobile) {
              setMobileNoticeOpen(true);
              return;
            }
            setMenuOpen((open) => !open);
          }}
          className={`inline-flex items-center justify-center gap-2 rounded-full border font-semibold transition-all duration-200 ${triggerSizeClass} ${
            menuOpen
              ? "border-white/30 bg-white/15 text-white"
              : "border-[#036AAF]/60 bg-[#036AAF] text-white hover:bg-[#025a94]"
          }`}
          aria-expanded={isMobile ? undefined : menuOpen}
          aria-haspopup={isMobile ? undefined : "menu"}
        >
          {label}
          <ChevronDown
            className={`size-4 transition-transform duration-200 max-md:hidden ${
              menuOpen ? "rotate-180" : ""
            }`}
            aria-hidden
          />
        </button>

        {menuOpen ? (
          <div
            role="menu"
            className="absolute right-0 z-50 mt-3 w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#0f2540]/95 p-2 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
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
                setMenuOpen(false);
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

      <EmployerMobileNoticeModal
        open={mobileNoticeOpen}
        onClose={() => setMobileNoticeOpen(false)}
        onContinueAnyway={() => {
          setMobileNoticeOpen(false);
          openAuthModal("login");
        }}
      />
    </>
  );
}
