"use client";

import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { usePanelHeader } from "@/components/panel/panel-header-context";
import {
  beginEmployerSignOut,
  isEmployerSigningOut,
} from "@/lib/auth/panel-sign-out";
import { auth, db } from "@/lib/firebase";

type UserDoc = {
  userType?: string;
};

type CorporateProfile = {
  companyName?: string;
  logoUrl?: string | null;
};

export default function IsverenPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { setPanelHeader } = usePanelHeader();

  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [companyName, setCompanyName] = useState("Şirket");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = useCallback(async () => {
    setIsSigningOut(true);
    beginEmployerSignOut();
    try {
      router.replace("/");
      await signOut(auth);
    } catch {
      setIsSigningOut(false);
    }
  }, [router]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (isEmployerSigningOut()) {
          router.replace("/");
          return;
        }
        router.replace("/isveren/giris");
        return;
      }

      try {
        const userSnap = await getDoc(doc(db, "users", user.uid));

        if (!userSnap.exists()) {
          router.replace("/isveren/kayit");
          return;
        }

        const userData = userSnap.data() as UserDoc;
        if (userData.userType !== "kurumsal") {
          router.replace("/isveren/giris");
          return;
        }

        const profileSnap = await getDoc(doc(db, "corporate_profiles", user.uid));
        if (profileSnap.exists()) {
          const profile = profileSnap.data() as CorporateProfile;
          if (profile.companyName?.trim()) {
            setCompanyName(profile.companyName.trim());
          }
          setLogoUrl(profile.logoUrl ?? null);
        }

        setIsCheckingAccess(false);
      } catch {
        router.replace("/isveren/giris");
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (isCheckingAccess) {
      setPanelHeader(null);
      return;
    }

    setPanelHeader({
      companyName,
      logoUrl,
      isSigningOut,
      onSignOut: handleSignOut,
    });

    return () => {
      setPanelHeader(null);
    };
  }, [
    companyName,
    logoUrl,
    handleSignOut,
    isCheckingAccess,
    isSigningOut,
    setPanelHeader,
  ]);

  if (isCheckingAccess) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#f7f8fa] py-16">
        <div className="flex flex-col items-center gap-3">
          <Loader2
            className="size-8 animate-spin text-[#036AAF]"
            aria-hidden
          />
          <p className="text-sm font-medium text-[#1a1a1a]/70">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f7f8fa]">
      <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200/60 sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
