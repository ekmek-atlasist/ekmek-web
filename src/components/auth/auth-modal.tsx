"use client";

import { X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  LoginForm,
  type LoginFormMode,
} from "@/components/auth/login-form";

type AuthModalContextValue = {
  openAuthModal: (mode: LoginFormMode) => void;
  closeAuthModal: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error("useAuthModal must be used within AuthModalProvider");
  }
  return context;
}

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<LoginFormMode>("login");
  const [formKey, setFormKey] = useState(0);

  const openAuthModal = useCallback((nextMode: LoginFormMode) => {
    setMode(nextMode);
    setFormKey((key) => key + 1);
    setIsOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const value = useMemo(
    () => ({ openAuthModal, closeAuthModal }),
    [openAuthModal, closeAuthModal],
  );

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      {isOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
          onClick={closeAuthModal}
        >
          <div
            className="relative w-full max-w-[400px] overflow-visible rounded-2xl bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeAuthModal}
              className="absolute top-3.5 right-3.5 z-20 rounded-full p-1.5 text-white/75 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Kapat"
            >
              <X className="size-5" />
            </button>

            <div id="auth-modal-title" className="sr-only">
              {mode === "register" ? "İşveren kaydı" : "İşveren girişi"}
            </div>

            <LoginForm
              key={formKey}
              mode={mode}
              recaptchaContainerId="recaptcha-container-modal"
              onComplete={closeAuthModal}
              className="overflow-visible"
            />
          </div>
        </div>
      ) : null}
    </AuthModalContext.Provider>
  );
}
