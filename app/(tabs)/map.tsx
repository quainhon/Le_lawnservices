import { useMemo, useState } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import RouteMap from "@/components/RouteMap";
import { useRouteState } from "@/hooks/useRouteState";
import { Customer } from "@/types/customer";

type Filter = "remaining" | "all" | "completed";

export default function MapScreen() {
  const { cycle, weeklyCustomers, jobs, loaded } = useRouteState();
  const [filter, setFilter] = useState<Filter>("remaining");
  const visible = useMemo(() => weeklyCustomers.filter((customer) => {
    const completed = jobs[customer.id]?.completed === true;
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
