import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Citation } from "@/lib/types";

type Ctx = {
  selectedCitationId: string | null;
  selectCitation: (id: string | null) => void;
  getCitation: (id: string) => Citation | undefined;
  setCitationMap: (map: Record<string, Citation>) => void;
  developerMode: boolean;
  setDeveloperMode: (v: boolean) => void;
};

const WorkspaceContext = createContext<Ctx | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [selectedCitationId, setSelectedCitationId] = useState<string | null>(null);
  const [developerMode, setDeveloperMode] = useState(false);
  const [citationMap, setCitationMapState] = useState<Record<string, Citation>>({});

  const value = useMemo<Ctx>(
    () => ({
      selectedCitationId,
      selectCitation: setSelectedCitationId,
      getCitation: (id) => citationMap[id],
      setCitationMap: setCitationMapState,
      developerMode,
      setDeveloperMode,
    }),
    [selectedCitationId, developerMode, citationMap],
  );

  return (
    <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return ctx;
}
