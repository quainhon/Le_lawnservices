import { useMemo, useState } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import RouteMap from "@/components/RouteMap";
import { useAppContext } from "@/state/AppContext";
import { selectActiveJobs, selectActiveWeek, selectWeeklyCustomers } from "@/domain/selectors";

type Filter = "remaining" | "all" | "completed";

export default function MapScreen() {
  const { state, loaded } = useAppContext();
  const cycle = selectActiveWeek(state).cycle;
  const weeklyCustomers = selectWeeklyCustomers(state);
  const jobs = selectActiveJobs(state);
  const [filter, setFilter] = useState<Filter>("remaining");
  const visible = useMemo(() => weeklyCustomers.filter((customer) => {
    const completed = jobs.some((job) => job.customer_id === customer.id && job.completed_at);
    return filter === "all" || (filter === "completed" ? completed : !completed);
  }), [filter, jobs, weeklyCustomers]);

  if (!loaded) return null;
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Map · Week {cycle}</Text>
      <View style={styles.filters}>
        {(["remaining", "all", "completed"] as Filter[]).map((option) => (
          <Pressable key={option} onPress={() => setFilter(option)} style={[styles.filter, filter === option && styles.activeFilter]}>
            <Text style={filter === option ? styles.activeFilterText : styles.filterText}>{option[0].toUpperCase() + option.slice(1)}</Text>
          </Pressable>
        ))}
      </View>
      <RouteMap customers={visible} jobs={jobs} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f5f7f5", paddingTop: 58 },
  title: { fontSize: 24, fontWeight: "800", color: "#17201b", paddingHorizontal: 16 },
  filters: { flexDirection: "row", padding: 16, gap: 8 },
  filter: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 18, backgroundColor: "#e5ebe7" },
  activeFilter: { backgroundColor: "#1f6b45" },
  filterText: { color: "#405047", fontWeight: "600" },
  activeFilterText: { color: "#fff", fontWeight: "700" },
});
