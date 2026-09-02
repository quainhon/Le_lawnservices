import AsyncStorage from "@react-native-async-storage/async-storage";
import customers from "@/data/customers.json";
import { AppState, Customer, ServiceJob, ServiceWeek } from "@/domain/types";
import { createServiceJobs, createServiceWeekId, DEFAULT_TEST_PRICE, getServiceWeek } from "@/domain/week";

export const STORAGE_KEY = "landscaping.app-state.v3";
const LEGACY_V2_KEY = "landscaping.route-state.v2";
const LEGACY_V1_KEY = "landscaping.route-state.v1";
const sourceCustomers = customers.customers as Customer[];
let saveQueue = Promise.resolve();

type LegacyJob = Partial<ServiceJob> & { customer_id: string; completed?: boolean; completed_at?: string | null };
type LegacyWeek = Partial<ServiceWeek> & { jobs?: Record<string, LegacyJob> };
type LegacyCharge = {
  id: string;
  customer_id: string;
  service_week_id: string;
  completed_at: string;
  service_price_at_service: number;
  billing_status: "paid" | "unpaid";
  paid_at: string | null;
};
type LegacyState = {
  active_week_id?: string;
  current_cycle?: "A" | "B";
  cycle?: "A" | "B";
  weeks?: Record<string, LegacyWeek>;
  history?: LegacyWeek[];
  jobs?: Record<"A" | "B", Record<string, LegacyJob>>;
  customer_prices?: Record<string, number>;
  billing_charges?: LegacyCharge[] | Record<string, LegacyCharge>;
  state?: AppState;
  customers?: Customer[];
  serviceWeeks?: ServiceWeek[] | Record<string, ServiceWeek>;
  serviceJobs?: ServiceJob[];
  activeWeekId?: string;
};

function initialState(): AppState {
  const weekBase = getServiceWeek();
  const week: ServiceWeek = { ...weekBase, id: createServiceWeekId([]), cycle: "A", finished_at: null, status: "active" };
  return {
    customers: sourceCustomers.map((customer) => ({ ...customer, service_price: customer.service_price ?? DEFAULT_TEST_PRICE })),
    serviceWeeks: [week],
    serviceJobs: createServiceJobs(sourceCustomers, week),
    activeWeekId: week.id
  };
}

export function createInitialState(): AppState {
  return initialState();
}

function normalizeState(value: LegacyState): AppState | null {
  const candidate = value.state ?? value;
  if (Array.isArray(candidate.serviceJobs) && candidate.serviceWeeks && candidate.activeWeekId) {
    const normalizedCustomers = (candidate.customers ?? sourceCustomers).map((customer) => ({ ...customer, service_price: customer.service_price ?? DEFAULT_TEST_PRICE }));
    const weeks = Array.isArray(candidate.serviceWeeks)
      ? candidate.serviceWeeks
      : Object.values(candidate.serviceWeeks);
    return {
      customers: normalizedCustomers,
      serviceWeeks: weeks.map((week) => ({ ...week, started_at: week.started_at ?? `${week.start_date ?? week.id}T00:00:00.000Z`, finished_at: week.finished_at ?? null, status: week.status ?? (week.id === candidate.activeWeekId ? "active" : "archived") })),
      serviceJobs: candidate.serviceJobs.map((job) => ({ ...job, billing_status: job.billing_status ?? null, adjustments: job.adjustments ?? [] })),
      activeWeekId: candidate.activeWeekId
    };
  }

  if (!value.weeks || !value.active_week_id) {
    const fallback = initialState();
    const cycle = value.cycle ?? "A";
    const legacyJobs = value.jobs?.[cycle] ?? {};
    fallback.serviceWeeks = fallback.serviceWeeks.map((week) =>
      week.id === fallback.activeWeekId ? { ...week, cycle } : week);
    fallback.serviceJobs = fallback.serviceJobs.map((job) => {
      const old = legacyJobs[job.customer_id];
      return old ? { ...job, completed: old.completed ?? false, completed_at: old.completed_at ?? null } : job;
    });
    return fallback;
  }

  const activeWeekId = value.active_week_id as string;
  const allWeeks = [...Object.values(value.weeks), ...(value.history ?? [])];
  const billing = Array.isArray(value.billing_charges)
    ? value.billing_charges
    : Object.values(value.billing_charges ?? {});
  const jobs: ServiceJob[] = [];
  allWeeks.forEach((legacyWeek, index) => {
    const id = legacyWeek.id ?? (index === 0 ? activeWeekId : `${activeWeekId}-history-${index}`);
    Object.values(legacyWeek.jobs ?? {}).forEach((old) => {
      const charge = billing.find((item) => item.id === old.id || (item.customer_id === old.customer_id && item.service_week_id === id));
      jobs.push({
        id: old.id ?? `${id}:${old.customer_id}`,
        customer_id: old.customer_id,
        week_id: id,
        route_order_at_service: old.route_order_at_service ?? old.route_order ?? sourceCustomers.find((customer) => customer.id === old.customer_id)?.route_order ?? 0,
        completed: old.completed ?? Boolean(charge),
        completed_at: old.completed_at ?? (charge?.completed_at ?? null),
        carryover_from_week_id: old.carryover_from_week_id ?? null,
        service_price_at_service: old.service_price_at_service ?? (charge?.service_price_at_service ?? null),
        billing_status: old.billing_status ?? (charge?.billing_status ?? null),
        paid_at: old.paid_at ?? (charge?.paid_at ?? null),
        adjustments: old.adjustments ?? []
      });
    });
  });
  const serviceWeeks = allWeeks.map((week, index) => {
    const id = week.id ?? (index === 0 ? activeWeekId : `${activeWeekId}-history-${index}`);
    return {
      id,
      started_at: week.started_at ?? `${week.start_date ?? id}T00:00:00.000Z`,
      finished_at: week.finished_at ?? null,
      cycle: week.cycle ?? (value.current_cycle ?? "A"),
      status: (id === value.active_week_id ? "active" : "archived") as "active" | "archived"
    };
  });
  const activeWeek = serviceWeeks.find((week) => week.id === activeWeekId);
  if (!activeWeek) return initialState();
  billing.forEach((charge) => {
    if (jobs.some((job) => job.id === charge.id)) return;
    const customer = sourceCustomers.find((item) => item.id === charge.customer_id);
    if (!customer || !serviceWeeks.some((week) => week.id === charge.service_week_id)) return;
    jobs.push({
      id: charge.id,
      customer_id: charge.customer_id,
      week_id: charge.service_week_id,
      route_order_at_service: customer.route_order,
      completed: true,
      completed_at: charge.completed_at,
      carryover_from_week_id: null,
      service_price_at_service: charge.service_price_at_service,
      billing_status: charge.billing_status,
      paid_at: charge.paid_at,
      adjustments: []
    });
  });
  const customerList = sourceCustomers.map((customer) => ({
    ...customer,
    service_price: value.customer_prices?.[customer.id] ?? customer.service_price ?? DEFAULT_TEST_PRICE
  }));
  return {
    customers: customerList,
    serviceWeeks,
    serviceJobs: jobs.length ? jobs : createServiceJobs(customerList, activeWeek),
    activeWeekId
  };
}

export async function loadAppState(): Promise<AppState | null> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY)
      ?? await AsyncStorage.getItem(LEGACY_V2_KEY)
      ?? await AsyncStorage.getItem(LEGACY_V1_KEY);
    return value ? normalizeState(JSON.parse(value) as LegacyState) : initialState();
  } catch (error) {
    console.warn("Unable to restore saved app state.", error);
    return initialState();
  }
}

export function persistAppState(state: AppState): Promise<void> {
  saveQueue = saveQueue.then(() => AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 3, ...state })));
  return saveQueue;
}
