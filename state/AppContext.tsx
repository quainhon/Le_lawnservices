import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useReducer, useState } from "react";
import { AppState } from "@/domain/types";
import { appReducer, AppAction } from "@/state/appReducer";
import { createInitialState, loadAppState, persistAppState } from "@/state/persistence";

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  loaded: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(appReducer, undefined, createInitialState);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadAppState().then((saved) => {
      if (saved) dispatch({ type: "HYDRATE", state: saved });
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (loaded) {
      void persistAppState(state);
    }
  }, [loaded, state]);

  const value = useMemo(() => ({ state, dispatch, loaded }), [state, loaded]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
}

export function useAppState(): AppState {
  return useAppContext().state;
}
