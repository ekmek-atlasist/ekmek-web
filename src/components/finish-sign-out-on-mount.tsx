"use client";

import { useEffect } from "react";
import { finishEmployerSignOut } from "@/lib/auth/panel-sign-out";

export function FinishSignOutOnMount() {
  useEffect(() => {
    finishEmployerSignOut();
  }, []);

  return null;
}
