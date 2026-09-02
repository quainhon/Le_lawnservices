import { Customer, Cycle, ServiceJob, ServiceWeek } from "@/domain/types";

export const DEFAULT_TEST_PRICE = 45;

export function getServiceWeek(date = new Date()): { started_at: string } {
  const current = new Date(date);
  const day = current.getDay();
  const daysSinceTuesday = (day + 5) % 7;
  const start = new Date(current);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - daysSinceTuesday);
  const end = new Date(start);
  end.setDate(end.getDate() + 5);
  return { started_at: start.toISOString() };
}

export function formatServiceWeekDate(value: string | null): string {
  if (!value) return "Current";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unknown date"
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatServiceWeekRange(week: ServiceWeek): string {
  return `${formatServiceWeekDate(week.started_at)} - ${formatServiceWeekDate(week.finished_at)}`;
}

export function createServiceWeekId(existingIds: Iterable<string>, now = new Date()): string {
  const usedIds = new Set(existingIds);
  const base = `week-${now.toISOString().replace(/[^0-9]/g, "")}`;
  let id = base;
  let suffix = 1;
  while (usedIds.has(id)) id = `${base}-${suffix++}`;
  return id;
}

export function nextServiceWeek(week: ServiceWeek): { started_at: string } {
  return getServiceWeek(new Date(new Date(week.started_at).getTime() + 7 * 86400000));
}

export function isCustomerActiveForCycle(customer: Customer, cycle: Cycle): boolean {
  return customer.status === "active" &&
    (customer.frequency === "weekly" || customer.biweekly_cycle === cycle);
}

export function getWeeklyCustomers(customers: Customer[], cycle: Cycle): Customer[] {
  return customers
    .filter((customer) => isCustomerActiveForCycle(customer, cycle))
    .sort((a, b) => a.route_order - b.route_order);
}

function emptyJob(week: ServiceWeek, customer: Customer, carryoverFromWeekId: string | null = null): ServiceJob {
  return {
    id: `${week.id}:${customer.id}`,
    customer_id: customer.id,
    week_id: week.id,
    route_order_at_service: customer.route_order,
    completed_at: null,
    carryover_from_week_id: carryoverFromWeekId,
    service_price_at_service: null,
    billing_status: null,
    paid_at: null
    , adjustments: []
  };
}

export function createServiceJobs(
  customers: Customer[],
  week: ServiceWeek,
  previousJobs: ServiceJob[] = [],
  carryover = false
): ServiceJob[] {
  const jobs = new Map<string, ServiceJob>();
  const previousByCustomer = new Map(previousJobs.map((job) => [job.customer_id, job]));
  getWeeklyCustomers(customers, week.cycle).forEach((customer) => {
    const previous = previousByCustomer.get(customer.id);
    jobs.set(customer.id, emptyJob(week, customer, previous && !previous.completed_at ? previous.week_id : null));
  });

  if (carryover) {
    previousJobs
      .filter((job) => !job.completed_at)
      .sort((a, b) => a.route_order_at_service - b.route_order_at_service)
      .forEach((previousJob) => {
        if (!jobs.has(previousJob.customer_id)) {
          const customer = customers.find((item) => item.id === previousJob.customer_id);
          if (customer) jobs.set(customer.id, emptyJob(week, customer, previousJob.week_id));
        }
      });
  }

  return [...jobs.values()].sort((a, b) => a.route_order_at_service - b.route_order_at_service);
}
