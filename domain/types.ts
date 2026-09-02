export type Cycle = "A" | "B";
export type Frequency = "weekly" | "biweekly";
export type BiweeklyCycle = Cycle | null;
export type CustomerStatus = "active" | "inactive";
export type BillingStatus = "unpaid" | "paid";

export interface ServiceJobAdjustment {
  id: string;
  amount: number;
  note: string;
  created_at: string;
}

export interface Customer {
  id: string;
  route_order: number;
  label: string;
  address: string;
  latitude: number;
  longitude: number;
  frequency: Frequency;
  biweekly_cycle: BiweeklyCycle;
  status: CustomerStatus;
  phone: string | null;
  service_price: number | null;
  notes: string;
}

export interface ServiceWeek {
  id: string;
  cycle: Cycle;
  started_at: string;
  finished_at: string | null;
  status: "active" | "archived";
  /** Legacy persistence fields accepted only while older saved data is migrated. */
  start_date?: string;
  end_date?: string;
  archived?: boolean;
}

export interface ServiceJob {
  id: string;
  customer_id: string;
  week_id: string;
  route_order_at_service: number;
  /** Legacy persistence field accepted only while older saved data is migrated. */
  route_order?: number;
  completed?: boolean;
  completed_at: string | null;
  carryover_from_week_id: string | null;
  service_price_at_service: number | null;
  billing_status: BillingStatus | null;
  paid_at: string | null;
  adjustments: ServiceJobAdjustment[];
}

export interface AppState {
  customers: Customer[];
  serviceWeeks: ServiceWeek[];
  serviceJobs: ServiceJob[];
  activeWeekId: string;
}
