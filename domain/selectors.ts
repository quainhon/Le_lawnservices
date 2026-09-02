import { AppState, Customer, ServiceJob, ServiceWeek } from "@/domain/types";
import { getWeeklyCustomers } from "@/domain/week";

export function selectActiveWeek(state: AppState): ServiceWeek {
  return state.serviceWeeks.find((week) => week.id === state.activeWeekId) ?? state.serviceWeeks[0];
}

export function selectCustomers(state: AppState): Customer[] {
  return state.customers;
}

export function selectJobsForWeek(state: AppState, weekId: string): ServiceJob[] {
  return state.serviceJobs
    .filter((job) => job.week_id === weekId)
    .sort((a, b) => a.route_order_at_service - b.route_order_at_service);
}

export function selectHistorySummaryForWeek(state: AppState, weekId: string) {
  const jobs = selectJobsForWeek(state, weekId);
  const completed = jobs.filter((job) => job.completed_at);
  const billed = completed.reduce((sum, job) => sum + getServiceJobTotal(job), 0);
  const collected = completed
    .filter((job) => job.billing_status === "paid")
    .reduce((sum, job) => sum + getServiceJobTotal(job), 0);
  return { jobs, completed, incomplete: jobs.filter((job) => !job.completed_at), billed, collected, due: billed - collected };
}

export function selectActiveJobs(state: AppState): ServiceJob[] {
  return selectJobsForWeek(state, state.activeWeekId);
}

export function selectCustomerById(state: AppState, customerId: string): Customer | undefined {
  return state.customers.find((customer) => customer.id === customerId);
}

export function selectWeeklyCustomers(state: AppState): Customer[] {
  const week = selectActiveWeek(state);
  const due = getWeeklyCustomers(state.customers, week.cycle);
  const dueIds = new Set(due.map((customer) => customer.id));
  const carryovers = selectActiveJobs(state)
    .filter((job) => !dueIds.has(job.customer_id) && !job.completed_at)
    .map((job) => selectCustomerById(state, job.customer_id))
    .filter((customer): customer is Customer => Boolean(customer));
  return [...due, ...carryovers].sort((a, b) => a.route_order - b.route_order);
}

export function selectCompletedCount(state: AppState): number {
  const jobs = new Set(selectActiveJobs(state).map((job) => job.customer_id));
  return selectWeeklyCustomers(state).filter((customer) =>
    jobs.has(customer.id) && selectActiveJobs(state).some((job) => job.customer_id === customer.id && job.completed_at)
  ).length;
}

export function selectBillingJobs(state: AppState): ServiceJob[] {
  return state.serviceJobs
    .filter((job) => job.completed_at && job.service_price_at_service != null)
    .sort((a, b) => new Date(b.completed_at ?? 0).getTime() - new Date(a.completed_at ?? 0).getTime());
}

export function selectBillingJobsForWeek(state: AppState, weekId: string): ServiceJob[] {
  return selectBillingJobs(state).filter((job) => job.week_id === weekId);
}

export function selectOutstandingBillingJobs(state: AppState): ServiceJob[] {
  return selectBillingJobs(state).filter((job) => job.billing_status !== "paid");
}

export function selectCustomerPaymentHistory(state: AppState, customerId: string): ServiceJob[] {
  return selectBillingJobs(state).filter((job) => job.customer_id === customerId);
}

export function getServiceJobTotal(job: ServiceJob): number {
  return (job.service_price_at_service ?? 0) + job.adjustments.reduce((sum, adjustment) => sum + adjustment.amount, 0);
}

export function selectWeeks(state: AppState): ServiceWeek[] {
  return [...state.serviceWeeks].sort((a, b) => b.started_at.localeCompare(a.started_at));
}
