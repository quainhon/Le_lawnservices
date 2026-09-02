import { Customer } from "@/types/customer";

export type Cycle = "A" | "B";

export function isCustomerActiveForCycle(customer: Customer, cycle: Cycle): boolean {
  return customer.status === "active" &&
    (customer.frequency === "weekly" || customer.biweekly_cycle === cycle);
}

export function getWeeklyCustomers(customers: Customer[], cycle: Cycle): Customer[] {
  return customers
    .filter((customer) => isCustomerActiveForCycle(customer, cycle))
    .sort((a, b) => a.route_order - b.route_order);
}
