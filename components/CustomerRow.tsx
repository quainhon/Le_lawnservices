import { Pressable, StyleSheet, Text, View } from "react-native";
import { Customer, WeeklyJobState } from "@/types/customer";

export function CustomerRow({ customer, job, onToggle, onPress }: {
  customer: Customer;
  job?: WeeklyJobState;
  onToggle?: () => void;
  onPress?: () => void;
}) {
  const completed = job?.completed === true;
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={[styles.row, completed && styles.completedRow]}>
      <Text style={styles.routeNumber}>#{String(customer.route_order).padStart(3, "0")}</Text>
      <View style={styles.details}>
        <Text style={styles.name}>{customer.label}</Text>
        <Text style={styles.address}>{customer.address}</Text>
        <Text style={styles.frequency}>
          {customer.frequency === "weekly" ? "Weekly" : `Biweekly ${customer.biweekly_cycle}`}
        </Text>
      </View>
      {onToggle && (
        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            onToggle();
          }}
          style={[styles.doneButton, completed && styles.undoButton]}
        >
          <Text style={styles.doneText}>{completed ? "UNDO" : "DONE"}</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", padding: 14, borderBottomWidth: 1, borderBottomColor: "#e5e7eb", backgroundColor: "#fff" },
  completedRow: { opacity: 0.58 },
  routeNumber: { width: 58, fontSize: 20, fontWeight: "800", color: "#1f6b45" },
  details: { flex: 1, paddingRight: 8 },
  name: { fontSize: 17, fontWeight: "700", color: "#17201b" },
  address: { fontSize: 15, marginTop: 3, color: "#3f4b44" },
  frequency: { fontSize: 13, marginTop: 5, color: "#68756d" },
  doneButton: { minWidth: 72, paddingVertical: 13, paddingHorizontal: 10, borderRadius: 7, backgroundColor: "#1f6b45", alignItems: "center" },
  undoButton: { backgroundColor: "#65736b" },
  doneText: { color: "#fff", fontSize: 13, fontWeight: "800" }
});
