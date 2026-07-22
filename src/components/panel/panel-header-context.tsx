"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type PanelHeaderState = {
  companyName: string;
  logoUrl: string | null;
  isSigningOut: boolean;
  onSignOut: () => void;
};

type PanelHeaderContextValue = {
  panelHeader: PanelHeaderState | null;
  setPanelHeader: (state: PanelHeaderState | null) => void;
};

const PanelHeaderContext = createContext<PanelHeaderContextValue | null>(null);

export function PanelHeaderProvider({ children }: { children: ReactNode }) {
  const [panelHeader, setPanelHeaderState] = useState<PanelHeaderState | null>(
    null,
  );

  const setPanelHeader = useCallback((state: PanelHeaderState | null) => {
    setPanelHeaderState(state);
  }, []);

  const value = useMemo(
    () => ({ panelHeader, setPanelHeader }),
    [panelHeader, setPanelHeader],
  );

  return (
    <PanelHeaderContext.Provider value={value}>
      {children}
    </PanelHeaderContext.Provider>
  );
}

export function usePanelHeader() {
  const context = useContext(PanelHeaderContext);
  if (!context) {
    throw new Error("usePanelHeader must be used within PanelHeaderProvider");
  }
  return context;
}

export function useOptionalPanelHeader() {
  return useContext(PanelHeaderContext);
}
