"use client";

import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";

type GuardStatus = "checking" | "allowed";

/**
 * Panel dışındaki kurumsal sayfalar için erişim kontrolü.
 * Giriş yapmamış veya bireysel kullanıcıyı ana sayfaya gönderir.
 */
export function useCorporateGuard(): GuardStatus {
  const router = useRouter();
  const [status, setStatus] = useState<GuardStatus>("checking");

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/");
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (cancelled) return;

        if (!snap.exists() || snap.data().userType !== "kurumsal") {
          router.replace("/");
          return;
        }

        setStatus("allowed");
      } catch {
        if (!cancelled) router.replace("/");
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [router]);

  return status;
}
