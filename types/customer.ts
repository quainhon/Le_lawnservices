export type Frequency = "weekly" | "biweekly";
export type BiweeklyCycle = "A" | "B" | null;
export type CustomerStatus = "active" | "inactive";

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

export interface WeeklyJobState {
  customer_id: string;
  completed: boolean;
  completed_at: string | null;
}
