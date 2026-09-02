import { AppState, BillingStatus, ServiceJob, ServiceWeek } from "@/domain/types";
import { createServiceJobs, createServiceWeekId, DEFAULT_TEST_PRICE, nextServiceWeek } from "@/domain/week";
import { selectActiveWeek } from "@/domain/selectors";
import { createInitialState } from "@/state/persistence";

export type AppAction =
  | { type: "HYDRATE"; state: AppState }
  | { type: "TOGGLE_JOB"; customerId: string; at?: string }
  | { type: "TOGGLE_SERVICE_JOB"; customerId: string; at?: string }
  | { type: "UPDATE_PAYMENT_STATUS"; jobId: string; status: BillingStatus; at?: string }
  | { type: "UPDATE_CUSTOMER_PRICE"; customerId: string; price: number }
  | { type: "SET_CYCLE"; cycle: "A" | "B" }
  | { type: "RESET_CURRENT_WEEK_COMPLETION" }
  | { type: "RESET_CURRENT_WEEK" }
  | { type: "RESET_ALL_PROTOTYPE_DATA" }
  | { type: "FINISH_WEEK" }
  | { type: "START_NEW_WEEK" }
  | { type: "ADD_JOB_ADJUSTMENT"; jobId: string; amount: number; note: string; at?: string }
  | { type: "REMOVE_JOB_ADJUSTMENT"; jobId: string; adjustmentId: string };

function replaceJobs(state: AppState, weekId: string, jobs: ServiceJob[]): AppState {
  return {
    ...state,
    serviceJobs: [...state.serviceJobs.filter((job) => job.week_id !== weekId), ...jobs]
  };
}

function finishWeek(state: AppState): AppState {
  const current = selectActiveWeek(state);
  if (!current) {
    console.error("Cannot finish week: active ServiceWeek not found.", state.activeWeekId);
    return state;
  }
  const next = nextServiceWeek(current);
  const nextCycle = current.cycle === "A" ? "B" : "A";
  const nextWeek: ServiceWeek = {
    ...next,
    id: createServiceWeekId(state.serviceWeeks.map((week) => week.id)),
    cycle: nextCycle,
    finished_at: null,
    status: "active"
  };
  const currentJobs = state.serviceJobs.filter((job) => job.week_id === current.id);
  const generated = createServiceJobs(state.customers, nextWeek, currentJobs, true);
  const existingJobs = state.serviceJobs.filter((job) => job.week_id === nextWeek.id);
  const jobsByCustomer = new Map(existingJobs.map((job) => [job.customer_id, job]));
  generated.forEach((job) => {
    if (!jobsByCustomer.has(job.customer_id)) jobsByCustomer.set(job.customer_id, job);
  });
  const nextState: AppState = {
    ...replaceJobs({ ...state, activeWeekId: nextWeek.id }, nextWeek.id, [...jobsByCustomer.values()]),
    serviceWeeks: state.serviceWeeks
      .map((week): ServiceWeek => week.id === current.id ? { ...week, finished_at: new Date().toISOString(), status: "archived" } : week)
      .concat([nextWeek])
      .map((week): ServiceWeek => week.id === nextWeek.id
        ? { ...week, status: "active" }
        : { ...week, status: "archived" })
  };
  return nextState;
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "HYDRATE":
      return action.state;
    case "TOGGLE_JOB":
    case "TOGGLE_SERVICE_JOB": {
      const current = selectActiveWeek(state);
      const currentJob = state.serviceJobs.find((job) => job.week_id === current.id && job.customer_id === action.customerId);
      if (!currentJob) return state;
      const completed = !currentJob.completed_at;
      const completedAt = completed ? (action.at ?? new Date().toISOString()) : null;
      const customer = state.customers.find((item) => item.id === action.customerId);
      if (!customer) return state;
      const updated = {
        ...currentJob,
        completed_at: completedAt,
        service_price_at_service: completed ? (customer.service_price ?? DEFAULT_TEST_PRICE) : null,
        billing_status: completed ? "unpaid" as const : null,
        paid_at: null,
        adjustments: []
      };
      return { ...state, serviceJobs: state.serviceJobs.map((job) => job.id === currentJob.id ? updated : job) };
    }
    case "UPDATE_PAYMENT_STATUS": {
      const paidAt = action.status === "paid" ? (action.at ?? new Date().toISOString()) : null;
      return {
        ...state,
        serviceJobs: state.serviceJobs.map((job) => job.id === action.jobId
          ? { ...job, billing_status: action.status, paid_at: paidAt }
          : job)
      };
    }
    case "ADD_JOB_ADJUSTMENT": {
      if (!Number.isFinite(action.amount) || action.amount <= 0) return state;
      return {
        ...state,
        serviceJobs: state.serviceJobs.map((job) => job.id === action.jobId && job.billing_status === "unpaid"
          ? { ...job, adjustments: [...job.adjustments, { id: `${job.id}:adjustment:${Date.now()}`, amount: action.amount, note: action.note.trim(), created_at: action.at ?? new Date().toISOString() }] }
          : job)
      };
    }
    case "REMOVE_JOB_ADJUSTMENT":
      return {
        ...state,
        serviceJobs: state.serviceJobs.map((job) => job.id === action.jobId && job.billing_status === "unpaid"
          ? { ...job, adjustments: job.adjustments.filter((adjustment) => adjustment.id !== action.adjustmentId) }
          : job)
      };
    case "UPDATE_CUSTOMER_PRICE":
      if (!Number.isFinite(action.price) || action.price < 0) return state;
      return {
        ...state,
        customers: state.customers.map((customer) =>
          customer.id === action.customerId ? { ...customer, service_price: action.price } : customer)
      };
    case "SET_CYCLE": {
      const week = selectActiveWeek(state);
      const currentJobs = state.serviceJobs.filter((job) => job.week_id === week.id);
      const generatedJobs = createServiceJobs(state.customers, { ...week, cycle: action.cycle });
      const existingByCustomer = new Map(currentJobs.map((job) => [job.customer_id, job]));
      generatedJobs.forEach((job) => {
        const existing = existingByCustomer.get(job.customer_id);
        if (!existing) existingByCustomer.set(job.customer_id, job);
      });
      return replaceJobs({
        ...state,
        serviceWeeks: state.serviceWeeks.map((item) => item.id === week.id ? { ...item, cycle: action.cycle } : item)
      }, week.id, [...existingByCustomer.values()]);
    }
    case "RESET_CURRENT_WEEK_COMPLETION":
    case "RESET_CURRENT_WEEK": {
      const week = selectActiveWeek(state);
      return {
        ...state,
        serviceJobs: state.serviceJobs.map((job) => job.week_id === week.id
          ? {
            ...job,
            completed_at: null,
            service_price_at_service: null,
            billing_status: null,
            paid_at: null,
            adjustments: []
          }
          : job)
      };
    }
    case "RESET_ALL_PROTOTYPE_DATA":
      return createInitialState();
    case "FINISH_WEEK":
    case "START_NEW_WEEK":
      return finishWeek(state);
    default:
      return state;
  }
}

export default appReducer;
