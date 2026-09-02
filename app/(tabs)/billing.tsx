import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useAppContext } from "@/state/AppContext";
import { getServiceJobTotal, selectActiveWeek, selectBillingJobs, selectCustomerById, selectCustomers, selectWeeks } from "@/domain/selectors";
import { Customer, ServiceJob } from "@/domain/types";
import { formatServiceWeekRange } from "@/domain/week";

type Filter = "unpaid" | "paid" | "all";
type Selection = string | "outstanding";

export default function BillingScreen() {
  const { state, dispatch, loaded } = useAppContext();
  const activeWeek = selectActiveWeek(state);
  const weeks = selectWeeks(state);
  const customers = selectCustomers(state);
  const billingJobs = selectBillingJobs(state);
  const [selectedWeekId, setSelectedWeekId] = useState<Selection>(activeWeek.id);
  const [filter, setFilter] = useState<Filter>("unpaid");
  const weekOptions = useMemo(() => Array.from(new Map(weeks.map((week) => [week.id, week])).values()), [weeks]);
  const selectedWeek = weekOptions.find((week) => week.id === selectedWeekId) ?? activeWeek;
  const rows = useMemo(() => billingJobs
    .filter((job) => selectedWeekId === "outstanding" ? job.billing_status !== "paid" : job.week_id === selectedWeek.id)
    .map((job) => ({ job, customer: selectCustomerById(state, job.customer_id) }))
    .filter((row): row is { job: ServiceJob; customer: Customer } => Boolean(row.customer))
    .filter(({ job }) => selectedWeekId === "outstanding" || filter === "all" || (filter === "paid" ? job.billing_status === "paid" : job.billing_status !== "paid")), [billingJobs, customers, filter, selectedWeek, selectedWeekId, state]);
  const completedJobs = billingJobs.filter((job) => selectedWeekId === "outstanding" ? job.billing_status !== "paid" : job.week_id === selectedWeek.id);
  const billed = completedJobs.reduce((sum, job) => sum + getServiceJobTotal(job), 0);
  const paid = completedJobs.filter((job) => job.billing_status === "paid").reduce((sum, job) => sum + getServiceJobTotal(job), 0);

  if (!loaded) return null;
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
    <Text style={styles.title}>Billing</Text>
    <View style={styles.weekPicker}>
      <Pressable onPress={() => setSelectedWeekId("outstanding")} style={[styles.weekButton, selectedWeekId === "outstanding" && styles.selectedWeek]}><Text style={selectedWeekId === "outstanding" ? styles.selectedWeekText : styles.weekText}>Outstanding</Text></Pressable>
      {weekOptions.map((week) => <Pressable key={week.id} onPress={() => setSelectedWeekId(week.id)} style={[styles.weekButton, selectedWeekId === week.id && styles.selectedWeek]}><Text style={selectedWeekId === week.id ? styles.selectedWeekText : styles.weekText}>{week.id === activeWeek.id ? "Current Week" : formatServiceWeekRange(week)}</Text></Pressable>)}
    </View>
    <View style={styles.summary}><Summary label="Billed" value={billed} /><Summary label="Paid" value={paid} /><Summary label="Due" value={billed - paid} /></View>
    <View style={styles.filters}>{(["unpaid", "paid", "all"] as Filter[]).map((option) => <Pressable key={option} onPress={() => setFilter(option)} style={[styles.filter, filter === option && styles.activeFilter]}><Text style={filter === option ? styles.activeFilterText : styles.filterText}>{option[0].toUpperCase() + option.slice(1)}</Text></Pressable>)}</View>
    {rows.map(({ job, customer }) => <Pressable key={job.id} style={styles.row} onPress={() => router.push(`/customer/${customer.id}`)}>
      <View style={styles.rowInfo}>
        <Text style={styles.route}>#{String(customer.route_order).padStart(3, "0")}</Text>
        <Text style={styles.name}>{customer.label}</Text>
        <Text style={styles.address}>{customer.address}</Text>
        <Text style={styles.date}>{formatTimestamp(job.completed_at ?? "")}</Text>
      </View>
      <View style={styles.charge}><Text style={styles.amount}>${getServiceJobTotal(job).toFixed(2)}</Text>{job.billing_status === "paid" ? <Pressable onPress={(event) => { event.stopPropagation(); dispatch({ type: "UPDATE_PAYMENT_STATUS", jobId: job.id, status: "unpaid" }); }}><Text style={styles.paid}>PAID · Undo Payment</Text></Pressable> : <Pressable onPress={(event) => { event.stopPropagation(); dispatch({ type: "UPDATE_PAYMENT_STATUS", jobId: job.id, status: "paid" }); }} style={styles.payButton}><Text style={styles.payText}>MARK PAID</Text></Pressable>}</View>
    </Pressable>)}
    {!rows.length && <Text style={styles.empty}>No billing entries in this view.</Text>}
  </ScrollView>;
}

function Summary({ label, value }: { label: string; value: number }) {
  return <View style={styles.stat}><Text style={styles.statValue}>${value.toFixed(2)}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}
function formatTimestamp(value: string) {
  return new Date(value).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f5f7f5" }, content: { padding: 16, paddingTop: 58, paddingBottom: 30 },
  title: { fontSize: 24, fontWeight: "800", color: "#17201b", marginBottom: 18 }, weekPicker: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  weekButton: { paddingVertical: 9, paddingHorizontal: 12, borderRadius: 18, backgroundColor: "#e5ebe7" }, selectedWeek: { backgroundColor: "#1f6b45" }, weekText: { color: "#405047", fontWeight: "600" }, selectedWeekText: { color: "#fff", fontWeight: "700" },
  summary: { flexDirection: "row", gap: 8, marginVertical: 18 }, stat: { flex: 1, backgroundColor: "#fff", padding: 11, borderRadius: 8, alignItems: "center" }, statValue: { fontSize: 17, fontWeight: "800", color: "#17201b" }, statLabel: { fontSize: 12, color: "#68756d", marginTop: 3 },
  filters: { flexDirection: "row", gap: 8, marginBottom: 10 }, filter: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 18, backgroundColor: "#e5ebe7" }, activeFilter: { backgroundColor: "#1f6b45" }, filterText: { color: "#405047", fontWeight: "600" }, activeFilterText: { color: "#fff", fontWeight: "700" },
  row: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 8, padding: 12, marginTop: 8 }, rowInfo: { flex: 1 }, route: { color: "#1f6b45", fontWeight: "800" }, name: { fontSize: 16, fontWeight: "700", color: "#17201b", marginTop: 3 }, address: { color: "#3f4b44", marginTop: 3 }, date: { color: "#68756d", fontSize: 12, marginTop: 5 }, charge: { alignItems: "flex-end", justifyContent: "center", marginLeft: 8 }, amount: { fontSize: 17, fontWeight: "800", color: "#17201b", marginBottom: 7 }, payButton: { backgroundColor: "#1f6b45", borderRadius: 6, paddingVertical: 9, paddingHorizontal: 8 }, payText: { color: "#fff", fontSize: 11, fontWeight: "800" }, paid: { color: "#1f6b45", fontSize: 11, fontWeight: "800", textAlign: "right" }, empty: { textAlign: "center", padding: 32, color: "#68756d" }
});
