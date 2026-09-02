import { useMemo, useState } from "react";
import { router } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { CustomerRow } from "@/components/CustomerRow";
import { Cycle } from "@/lib/route";
import { useRouteState } from "@/hooks/useRouteState";

type Filter = "remaining" | "all" | "completed";

export default function RouteScreen() {
  const { cycle, setCycle, weeklyCustomers, jobs, completedCount, toggleCompleted, loaded } = useRouteState();
  const [filter, setFilter] = useState<Filter>("remaining");
  const visible = useMemo(() => weeklyCustomers.filter((customer) => {
    const completed = jobs[customer.id]?.completed === true;
    return filter === "all" || (filter === "completed" ? completed : !completed);
  }), [filter, jobs, weeklyCustomers]);

  if (!loaded) return <View style={styles.center}><ActivityIndicator /></View>;
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.brand}>LANDSCAPING</Text>
      <View style={styles.cycleRow}>
        {(["A", "B"] as Cycle[]).map((option) => (
          <Pressable key={option} onPress={() => setCycle(option)} style={[styles.cycleButton, cycle === option && styles.selectedCycle]}>
            <Text style={[styles.cycleText, cycle === option && styles.selectedText]}>Week {option}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.stats}>
        <Stat label="Total" value={weeklyCustomers.length} />
        <Stat label="Completed" value={completedCount} />
        <Stat label="Remaining" value={weeklyCustomers.length - completedCount} />
      </View>
      <View style={styles.filters}>
        {(["remaining", "all", "completed"] as Filter[]).map((option) => (
          <Pressable key={option} onPress={() => setFilter(option)} style={[styles.filter, filter === option && styles.activeFilter]}>
            <Text style={filter === option ? styles.activeFilterText : styles.filterText}>{option[0].toUpperCase() + option.slice(1)}</Text>
          </Pressable>
        ))}
      </View>
      {visible.map((customer) => (
        <CustomerRow
          key={customer.id}
          customer={customer}
          job={jobs[customer.id]}
          onToggle={() => toggleCompleted(customer.id)}
          onPress={() => router.push(`/customer/${customer.id}`)}
        />
      ))}
      {!visible.length && <Text style={styles.empty}>No customers in this view.</Text>}
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f5f7f5" }, content: { paddingTop: 58, paddingBottom: 24 },
  brand: { paddingHorizontal: 16, fontSize: 18, letterSpacing: 1.5, fontWeight: "800", color: "#17201b" },
  cycleRow: { flexDirection: "row", margin: 16, gap: 8 }, cycleButton: { flex: 1, padding: 13, borderRadius: 8, borderWidth: 1, borderColor: "#b8c7bc", alignItems: "center" },
  selectedCycle: { backgroundColor: "#1f6b45", borderColor: "#1f6b45" }, cycleText: { fontWeight: "700", color: "#1f6b45" }, selectedText: { color: "#fff" },
  stats: { flexDirection: "row", marginHorizontal: 16, marginBottom: 16, gap: 8 }, stat: { flex: 1, backgroundColor: "#fff", padding: 12, borderRadius: 8, alignItems: "center" },
  statValue: { fontSize: 24, fontWeight: "800", color: "#17201b" }, statLabel: { fontSize: 12, color: "#68756d", marginTop: 2 },
  filters: { flexDirection: "row", paddingHorizontal: 16, paddingBottom: 10, gap: 8 }, filter: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 18, backgroundColor: "#e5ebe7" },
  activeFilter: { backgroundColor: "#1f6b45" }, filterText: { color: "#405047", fontWeight: "600" }, activeFilterText: { color: "#fff", fontWeight: "700" },
  empty: { textAlign: "center", padding: 32, color: "#68756d" }, center: { flex: 1, justifyContent: "center", alignItems: "center" }
});
