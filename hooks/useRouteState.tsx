import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Customer, WeeklyJobState } from "@/types/customer";
import { Cycle, getWeeklyCustomers } from "@/lib/route";
import customers from "@/data/customers.json";

const STORAGE_KEY = "landscaping.route-state.v1";
type StoredState = { cycle: Cycle; jobs: Record<Cycle, Record<string, WeeklyJobState>> };

const customerData = customers.customers as Customer[];
const emptyState: StoredState = { cycle: "A", jobs: { A: {}, B: {} } };

type RouteState = ReturnType<typeof useRouteStateValue>;
const RouteStateContext = createContext<RouteState | null>(null);

function useRouteStateValue() {
  const [stored, setStored] = useState<StoredState>(emptyState);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (value) setStored(JSON.parse(value) as StoredState);
        setLoaded(true);
      })
      .catch((error: unknown) => {
        console.warn("Unable to restore saved route state.", error);
        setLoaded(true);
      });
  }, []);

  const save = useCallback((next: StoredState) => {
    setStored(next);
    return AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const cycle = stored.cycle;
  const weeklyCustomers = useMemo(() => getWeeklyCustomers(customerData, cycle), [cycle]);
  const jobs = stored.jobs[cycle];
  const completedCount = weeklyCustomers.filter((customer) => jobs[customer.id]?.completed).length;

  const toggleCompleted = useCallback((customerId: string) => {
    const wasCompleted = stored.jobs[cycle][customerId]?.completed === true;
    const next: StoredState = {
      ...stored,
      jobs: {
        ...stored.jobs,
        [cycle]: {
          ...stored.jobs[cycle],
          [customerId]: {
            customer_id: customerId,
            completed: !wasCompleted,
            completed_at: wasCompleted ? null : new Date().toISOString()
          }
        }
      }
    };
    void save(next);
  }, [cycle, save, stored]);

  const setCycle = useCallback((nextCycle: Cycle) => {
    void save({ ...stored, cycle: nextCycle });
  }, [save, stored]);

  const resetCurrentCycle = useCallback(() => {
    void save({ ...stored, jobs: { ...stored.jobs, [cycle]: {} } });
  }, [cycle, save, stored]);

  return {
    customers: customerData,
    cycle,
    setCycle,
    weeklyCustomers,
    jobs,
    completedCount,
    toggleCompleted,
    resetCurrentCycle,
    loaded
  };
}

export function RouteStateProvider({ children }: PropsWithChildren) {
  const value = useRouteStateValue();
  return <RouteStateContext.Provider value={value}>{children}</RouteStateContext.Provider>;
}

export function useRouteState() {
  const context = useContext(RouteStateContext);
  if (!context) throw new Error("useRouteState must be used within RouteStateProvider");
  return context;
}
