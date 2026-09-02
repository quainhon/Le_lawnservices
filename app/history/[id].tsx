import { router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { ReactNode } from "react";
import { useAppContext } from "@/state/AppContext";
import { selectCustomerById, selectHistorySummaryForWeek } from "@/domain/selectors";
import { formatServiceWeekRange } from "@/domain/week";

export default function HistoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, loaded } = useAppContext();
  const week = state.serviceWeeks.find((item) => item.id === id);

  if (!loaded) return null;
  if (!week || week.status !== "archived") {
    return <View style={styles.center}><Text>Archived week not found.</Text><Pressable onPress={() => router.back()}><Text style={styles.backText}>Back</Text></Pressable></View>;
  }

  const summary = selectHistorySummaryForWeek(state, week.id);
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()}><Text style={styles.backText}>‹ Back</Text></Pressable>
      <Text style={styles.cycle}>Week {week.cycle}</Text>
      <Text style={styles.range}>{formatServiceWeekRange(week)}</Text>
      <Text style={styles.summary}>{summary.completed.length} / {summary.jobs.length} completed</Text>
      <Text style={styles.incomplete}>{summary.incomplete.length} incomplete</Text>
      <View style={styles.paymentSummary}>
        <Amount label="Billed" value={summary.billed} />
        <Amount label="Collected" value={summary.collected} />
        <Amount label="Due" value={summary.due} />
      </View>
      <Text style={styles.section}>Completed ({summary.completed.length})</Text>
      {summary.completed.map((job) => {
        const customer = selectCustomerById(state, job.customer_id);
        if (!customer) return null;
        return <JobCard key={job.id}><Text style={styles.route}>#{String(job.route_order_at_service).padStart(3, "0")}</Text><Text style={styles.name}>{customer.label}</Text><Text style={styles.address}>{customer.address}</Text><Text style={styles.meta}>Done {formatTimestamp(job.completed_at)}</Text><Text style={styles.payment}>${getTotal(job).toFixed(2)} · {job.billing_status === "paid" ? `PAID${job.paid_at ? ` ${formatDate(job.paid_at)}` : ""}` : "UNPAID"}</Text></JobCard>;
      })}
      {!summary.completed.length && <Text style={styles.empty}>No completed jobs</Text>}
      <Text style={styles.section}>Incomplete / Carried Over ({summary.incomplete.length})</Text>
      {summary.incomplete.map((job) => {
        const customer = selectCustomerById(state, job.customer_id);
        if (!customer) return null;
        const carried = state.serviceJobs.some((nextJob) => nextJob.carryover_from_week_id === week.id && nextJob.customer_id === job.customer_id);
        return <JobCard key={job.id}><Text style={styles.route}>#{String(job.route_order_at_service).padStart(3, "0")}</Text><Text style={styles.name}>{customer.label}</Text><Text style={styles.address}>{customer.address}</Text>{carried && <Text style={styles.badge}>Carried to next week</Text>}</JobCard>;
      })}
      {!summary.incomplete.length && <Text style={styles.empty}>All scheduled jobs were completed</Text>}
    </ScrollView>
  );
}

function JobCard({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}
function Amount({ label, value }: { label: string; value: number }) {
  return <View style={styles.amount}><Text style={styles.amountValue}>${value.toFixed(2)}</Text><Text style={styles.amountLabel}>{label}</Text></View>;
}
function getTotal(job: { service_price_at_service: number | null; adjustments: { amount: number }[] }) {
  return (job.service_price_at_service ?? 0) + job.adjustments.reduce((sum, adjustment) => sum + adjustment.amount, 0);
}
function formatTimestamp(value: string | null) {
  return value ? new Date(value).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "";
}
function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f5f7f5" }, content: { padding: 16, paddingTop: 58, paddingBottom: 32 }, center: { flex: 1, justifyContent: "center", alignItems: "center" },
  backText: { color: "#1f6b45", fontSize: 17, fontWeight: "700", marginBottom: 24 }, cycle: { fontSize: 28, fontWeight: "800", color: "#17201b" }, range: { fontSize: 18, color: "#3f4b44", marginTop: 4 },
  summary: { fontSize: 20, fontWeight: "800", color: "#17201b", marginTop: 24 }, incomplete: { color: "#68756d", marginTop: 4 }, paymentSummary: { flexDirection: "row", gap: 8, marginTop: 20 }, amount: { flex: 1, backgroundColor: "#fff", borderRadius: 8, padding: 10, alignItems: "center" }, amountValue: { fontSize: 16, fontWeight: "800", color: "#17201b" }, amountLabel: { color: "#68756d", marginTop: 3, fontSize: 12 },
  section: { fontSize: 20, fontWeight: "800", color: "#17201b", marginTop: 30, marginBottom: 8 }, card: { backgroundColor: "#fff", borderRadius: 8, padding: 12, marginTop: 8 }, route: { color: "#1f6b45", fontWeight: "800" }, name: { fontSize: 16, fontWeight: "700", color: "#17201b", marginTop: 3 }, address: { color: "#3f4b44", marginTop: 3 }, meta: { color: "#68756d", marginTop: 6 }, payment: { color: "#1f6b45", fontWeight: "700", marginTop: 4 }, badge: { color: "#68756d", fontSize: 12, marginTop: 7 }, empty: { color: "#68756d", marginTop: 8 }
});
