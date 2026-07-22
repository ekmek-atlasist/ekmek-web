"use client";

import { LoginForm } from "@/components/auth/login-form";

export default function IsverenGirisPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-[#0f2540] px-6 py-12">
      <LoginForm className="w-full max-w-[400px] overflow-visible rounded-2xl bg-white shadow-xl" />
    </main>
  );
}
