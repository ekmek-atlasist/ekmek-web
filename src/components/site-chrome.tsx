"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AuthModalProvider } from "@/components/auth/auth-modal";
import Header from "@/components/header";
import { PanelHeaderProvider } from "@/components/panel/panel-header-context";
import { SiteFooter } from "@/components/site-footer";
import { GLOBAL_HEADER_HEIGHT_PX } from "@/lib/layout-constants";

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  return (
    <AuthModalProvider>
      <PanelHeaderProvider>
        <Header />
        <div
          className="flex min-h-0 flex-1 flex-col"
          style={{ paddingTop: isLanding ? 0 : GLOBAL_HEADER_HEIGHT_PX }}
        >
          {children}
        </div>
        <SiteFooter />
      </PanelHeaderProvider>
    </AuthModalProvider>
  );
}
