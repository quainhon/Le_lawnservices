import { useEffect, useMemo, useRef, useState } from "react";
import { router } from "expo-router";
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { CustomerRow } from "@/components/CustomerRow";
import { useAppContext } from "@/state/AppContext";
import { selectActiveJobs, selectActiveWeek, selectCompletedCount, selectWeeklyCustomers } from "@/domain/selectors";

type Filter = "remaining" | "all" | "completed";

export default function RouteScreen() {
  const { state, dispatch, loaded } = useAppContext();
  const cycle = selectActiveWeek(state).cycle;
  const weeklyCustomers = selectWeeklyCustomers(state);
  const jobs = selectActiveJobs(state);
  const completedCount = selectCompletedCount(state);
  const [filter, setFilter] = useState<Filter>("remaining");
  const scrollViewRef = useRef<ScrollView>(null);
  const previousActiveWeekId = useRef(state.activeWeekId);
  useEffect(() => {
    if (previousActiveWeekId.current !== state.activeWeekId) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      previousActiveWeekId.current = state.activeWeekId;
    }
  }, [state.activeWeekId]);
  const visible = useMemo(() => weeklyCustomers.filter((customer) => {
    const completed = jobs.some((job) => job.customer_id === customer.id && job.completed_at);
    return filter === "all" || (filter === "completed" ? completed : !completed);
  }), [filter, jobs, weeklyCustomers]);
  const remainingJobs = useMemo(() => weeklyCustomers.filter((customer) => !jobs.some((job) => job.customer_id === customer.id && job.completed_at)), [jobs, weeklyCustomers]);
  const handleFinishWeek = () => {
    const finishWeek = () => {
      dispatch({ type: "FINISH_WEEK" });
    };

    if (Platform.OS === "web" && typeof window !== "undefined") {
      const message = remainingJobs.length === 0
        ? "Finish this week and start the next week?"
        : `${remainingJobs.length} jobs are still unfinished.\nThey will carry over to the next week.\nFinish anyway?`;
      const confirmed = window.confirm(message);
      if (!confirmed) return;
      dispatch({ type: "FINISH_WEEK" });
      return;
    }

    if (remainingJobs.length === 0) {
      Alert.alert("Finish this week and start the next week?", undefined, [
        { text: "CANCEL", style: "cancel" },
        { text: "FINISH WEEK", onPress: finishWeek }
      ]);
    } else {
      Alert.alert(
        `${remainingJobs.length} jobs are still unfinished.`,
        "They will carry over to the next week.\nFinish anyway?",
        [
          { text: "CANCEL", style: "cancel" },
          { text: "FINISH ANYWAY", onPress: finishWeek }
        ]
      );
    }
  };

  if (!loaded) return <View style={styles.center}><ActivityIndicator /></View>;
  return (
    <ScrollView ref={scrollViewRef} style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.brand}>LANDSCAPING</Text>
      <Text style={styles.currentWeek}>Current Week · Week {cycle}</Text>
      <View style={styles.stats}>
        <Stat label="Total" value={weeklyCustomers.length} />
        <Stat label="Completed" value={completedCount} />
        <Stat label="Remaining" value={weeklyCustomers.length - completedCount} />
      </View>
      <View style={styles.filters}>
        {(["remaining", "completed", "all"] as Filter[]).map((option) => (
          <Pressable key={option} onPress={() => setFilter(option)} style={[styles.filter, filter === option && styles.activeFilter]}>
            <Text style={filter === option ? styles.activeFilterText : styles.filterText}>{option[0].toUpperCase() + option.slice(1)}</Text>
          </Pressable>
        ))}
      </View>
      {visible.map((customer) => (
        <CustomerRow
          key={customer.id}
          customer={customer}
          job={jobs.find((job) => job.customer_id === customer.id)}
          onToggle={() => dispatch({ type: "TOGGLE_JOB", customerId: customer.id })}
          onPress={() => router.push(`/customer/${customer.id}`)}
        />
      ))}
      {!visible.length && <Text style={styles.empty}>No customers in this view.</Text>}
      <Pressable
        onPress={handleFinishWeek}
        style={styles.finishWeek}
      >
          <Text style={styles.finishWeekText}>FINISH WEEK</Text>
      </Pressable>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f5f7f5" }, content: { paddingTop: 58, paddingBottom: 24 },
  brand: { paddingHorizontal: 16, fontSize: 18, letterSpacing: 1.5, fontWeight: "800", color: "#17201b" },
  currentWeek: { margin: 16, fontSize: 16, fontWeight: "700", color: "#1f6b45" },
  stats: { flexDirection: "row", marginHorizontal: 16, marginBottom: 16, gap: 8 }, stat: { flex: 1, backgroundColor: "#fff", padding: 12, borderRadius: 8, alignItems: "center" },
  statValue: { fontSize: 24, fontWeight: "800", color: "#17201b" }, statLabel: { fontSize: 12, color: "#68756d", marginTop: 2 },
  filters: { flexDirection: "row", paddingHorizontal: 16, paddingBottom: 10, gap: 8 }, filter: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 18, backgroundColor: "#e5ebe7" },
  activeFilter: { backgroundColor: "#1f6b45" }, filterText: { color: "#405047", fontWeight: "600" }, activeFilterText: { color: "#fff", fontWeight: "700" },
  empty: { textAlign: "center", padding: 32, color: "#68756d" }, center: { flex: 1, justifyContent: "center", alignItems: "center" },
  finishWeek: { margin: 16, padding: 17, borderRadius: 8, backgroundColor: "#1f6b45", alignItems: "center" }, finishWeekText: { color: "#fff", fontWeight: "800", letterSpacing: 1 }
});
