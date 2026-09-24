"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthEntryButton } from "@/components/auth/auth-entry-button";
import { PanelHeaderNav } from "@/components/panel/panel-header-nav";
import { useOptionalPanelHeader } from "@/components/panel/panel-header-context";

export default function Header() {
  const pathname = usePathname();
  const panelHeaderContext = useOptionalPanelHeader();
  const panelHeader = panelHeaderContext?.panelHeader ?? null;

  const [scrolled, setScrolled] = useState(false);

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
          <AuthEntryButton label="Giriş" />
        </div>
      ) : null}
    </header>
  );
}
