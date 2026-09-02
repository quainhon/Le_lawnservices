import { useMemo } from "react";
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useRouteState } from "@/hooks/useRouteState";
import { Customer } from "@/types/customer";

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { customers, cycle, jobs, toggleCompleted, loaded } = useRouteState();
  const customer = useMemo(() => customers.find((item) => item.id === id), [customers, id]);

  if (!loaded) return null;
  if (!customer) {
    return <View style={styles.center}><Text>Customer not found.</Text><Pressable onPress={() => router.back()}><Text style={styles.backLink}>Back</Text></Pressable></View>;
  }

  const completed = jobs[customer.id]?.completed === true;
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹ Back</Text></Pressable>
      <Text style={styles.routeNumber}>#{String(customer.route_order).padStart(3, "0")}</Text>
      <Text style={styles.name}>{customer.label}</Text>
      <Text style={styles.address}>{customer.address}</Text>
      <Info label="Frequency" value={customer.frequency === "weekly" ? "Weekly" : `Biweekly ${customer.biweekly_cycle}`} />
      <Info label="Status" value={customer.status} />
      <Pressable onPress={() => toggleCompleted(customer.id)} style={[styles.doneButton, completed && styles.undoButton]}>
        <Text style={styles.buttonText}>{completed ? "UNDO" : "DONE"}</Text>
      </Pressable>
      <Pressable onPress={() => openNavigation(customer)} style={styles.navigateButton}>
        <Text style={styles.navigateText}>NAVIGATE</Text>
      </Pressable>
      <Text style={styles.cycleNote}>Completion is tracked for Week {cycle}.</Text>
    </ScrollView>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <View style={styles.info}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>;
}

async function openNavigation(customer: Customer) {
  const destination = Number.isFinite(customer.latitude) && Number.isFinite(customer.longitude)
    ? `${customer.latitude},${customer.longitude}`
    : encodeURIComponent(customer.address);
  const url = Platform.OS === "web"
    ? `https://www.google.com/maps/dir/?api=1&destination=${destination}`
    : `http://maps.apple.com/?daddr=${destination}&dirflg=d`;
  try {
    if (Platform.OS === "web" && typeof window !== "undefined") window.open(url, "_blank", "noopener,noreferrer");
    else await Linking.openURL(url);
  } catch {
    Alert.alert("Unable to open navigation", "Please check that a maps app is available.");
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f5f7f5" },
  content: { padding: 16, paddingTop: 58, paddingBottom: 32 },
  back: { alignSelf: "flex-start", paddingVertical: 8, marginBottom: 24 },
  backText: { color: "#1f6b45", fontSize: 17, fontWeight: "700" },
  routeNumber: { fontSize: 36, fontWeight: "800", color: "#1f6b45" },
  name: { fontSize: 26, fontWeight: "800", color: "#17201b", marginTop: 8 },
  address: { fontSize: 19, lineHeight: 27, color: "#3f4b44", marginTop: 10, marginBottom: 26 },
  info: { backgroundColor: "#fff", borderRadius: 8, padding: 14, marginBottom: 10 },
  infoLabel: { fontSize: 13, color: "#68756d", textTransform: "uppercase", fontWeight: "700" },
  infoValue: { fontSize: 18, color: "#17201b", marginTop: 4, textTransform: "capitalize" },
  doneButton: { padding: 17, borderRadius: 8, backgroundColor: "#1f6b45", alignItems: "center", marginTop: 18 },
  undoButton: { backgroundColor: "#65736b" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  navigateButton: { padding: 19, borderRadius: 8, backgroundColor: "#17201b", alignItems: "center", marginTop: 12 },
  navigateText: { color: "#fff", fontSize: 18, fontWeight: "800", letterSpacing: 1 },
  cycleNote: { textAlign: "center", color: "#68756d", marginTop: 18 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14 },
  backLink: { color: "#1f6b45", fontWeight: "700" }
});
