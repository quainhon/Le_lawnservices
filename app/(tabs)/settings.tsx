import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useAppContext } from "@/state/AppContext";
import { selectActiveWeek, selectCompletedCount, selectJobsForWeek, selectWeeklyCustomers, selectWeeks } from "@/domain/selectors";
import { formatServiceWeekRange } from "@/domain/week";

export default function SettingsScreen() {
  const { state, dispatch } = useAppContext();
  const cycle = selectActiveWeek(state).cycle;
  const history = selectWeeks(state).filter((week) => week.status === "archived");
  const completedCount = selectCompletedCount(state);
  const weeklyCustomers = selectWeeklyCustomers(state);
  const startNextWeek = () => {
    const remainingCount = weeklyCustomers.length - completedCount;
    const message = remainingCount === 0
      ? "Finish this week and start the next week?"
      : `${remainingCount} jobs are still unfinished.\nThey will carry over to the next week.\nFinish anyway?`;
    if (Platform.OS === "web" && typeof window !== "undefined") {
      if (window.confirm(message)) {
        dispatch({ type: "FINISH_WEEK" });
      }
      return;
    }
    Alert.alert(
      remainingCount === 0 ? "Finish this week and start the next week?" : `${remainingCount} jobs are still unfinished.`,
      remainingCount === 0 ? undefined : "They will carry over to the next week.\nFinish anyway?",
      [
      { text: "Cancel", style: "cancel" },
      { text: remainingCount === 0 ? "Finish Week" : "Start Next Week Anyway", onPress: () => {
        dispatch({ type: "FINISH_WEEK" });
      } }
      ]
    );
  };
  const resetAllPrototypeData = () => {
    const reset = () => dispatch({ type: "RESET_ALL_PROTOTYPE_DATA" });
    const message = "This will delete all prototype week, history, billing, and completion data and restart from a fresh Week A. Customer prototype data will be preserved.";
    if (Platform.OS === "web" && typeof window !== "undefined") {
      if (window.confirm(message)) reset();
      return;
    }
    Alert.alert("Reset All Prototype Data?", message, [
      { text: "Cancel", style: "cancel" },
      { text: "Reset Prototype", style: "destructive", onPress: reset }
    ]);
  };
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
    <Text style={styles.title}>Settings</Text>
    <Text style={styles.label}>Current cycle (admin)</Text>
    <View style={styles.cycleStatus}><Text style={styles.cycleStatusLabel}>Week {cycle}</Text><Text style={styles.cycleStatusText}>Controlled by the active service week</Text></View>
    <Pressable onPress={startNextWeek} style={styles.newWeek}><Text style={styles.newWeekText}>Start Next Week Anyway</Text></Pressable>
    <Pressable onPress={() => {
      const reset = () => dispatch({ type: "RESET_CURRENT_WEEK_COMPLETION" });
      if (Platform.OS === "web" && typeof window !== "undefined") {
        if (window.confirm(`Reset Week ${cycle} completion data?`)) reset();
        return;
      }
      Alert.alert("Reset completion data?", `This will clear Week ${cycle}.`, [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", style: "destructive", onPress: reset }
      ]);
    }} style={styles.reset}><Text style={styles.resetText}>Reset current week's completion data</Text></Pressable>
    {__DEV__ && <Pressable onPress={resetAllPrototypeData} style={styles.fullReset}><Text style={styles.fullResetText}>Reset All Prototype Data</Text></Pressable>}
    <Text style={styles.historyTitle}>History</Text>
    {!history.length && <Text style={styles.empty}>No archived weeks yet.</Text>}
    {history.map((week) => {
      const jobs = selectJobsForWeek(state, week.id);
      const completed = jobs.filter((job) => job.completed_at).length;
      return <Pressable key={week.id} style={styles.historyRow} onPress={() => router.push(`/history/${week.id}`)}>
        <Text style={styles.historyDate}>Week {week.cycle} · {formatServiceWeekRange(week)}</Text>
        <Text style={styles.historyCount}>{completed} / {jobs.length} completed</Text>
      </Pressable>;
    })}
  </ScrollView>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: "#f5f7f5" }, content: { padding: 16, paddingTop: 58, paddingBottom: 30 }, title: { fontSize: 24, fontWeight: "800", color: "#17201b", marginBottom: 30 }, label: { fontSize: 14, color: "#68756d", marginBottom: 8 }, cycleStatus: { backgroundColor: "#e5ebe7", borderRadius: 8, padding: 14 }, cycleStatusLabel: { color: "#1f6b45", fontSize: 18, fontWeight: "800" }, cycleStatusText: { color: "#68756d", marginTop: 4 }, newWeek: { marginTop: 28, backgroundColor: "#1f6b45", borderRadius: 8, padding: 16 }, newWeekText: { color: "#fff", fontWeight: "800", textAlign: "center" }, reset: { marginTop: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: "#d1dbd4", borderRadius: 8, padding: 16 }, resetText: { color: "#9b2c2c", fontWeight: "700", textAlign: "center" }, fullReset: { marginTop: 12, backgroundColor: "#fff4f4", borderWidth: 1, borderColor: "#e6b8b8", borderRadius: 8, padding: 16 }, fullResetText: { color: "#9b2c2c", fontWeight: "800", textAlign: "center" }, historyTitle: { fontSize: 20, fontWeight: "800", color: "#17201b", marginTop: 34, marginBottom: 10 }, empty: { color: "#68756d" }, historyRow: { backgroundColor: "#fff", borderRadius: 8, padding: 14, marginTop: 8 }, historyDate: { fontSize: 16, fontWeight: "700", color: "#17201b" }, historyCount: { marginTop: 4, color: "#68756d" } });
