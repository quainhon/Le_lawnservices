import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Customer, ServiceJob } from "@/domain/types";

export default function RouteMap({ customers, jobs }: { customers: Customer[]; jobs: ServiceJob[] }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Map preview</Text>
      <Text style={styles.body}>Native iPhone builds show interactive map markers. Web preview lists the same coordinate-backed customers.</Text>
      {customers.filter(hasCoordinates).map((customer) => (
        <Pressable key={customer.id} onPress={() => router.push(`/customer/${customer.id}`)} style={styles.row}>
          <View style={[styles.marker, jobs.some((job) => job.customer_id === customer.id && job.completed_at) ? styles.completedMarker : styles.incompleteMarker]}><Text style={styles.markerText}>{customer.route_order}</Text></View>
          <View style={styles.details}><Text style={styles.name}>{customer.label}</Text><Text style={styles.address}>{customer.address}</Text><Text style={styles.coordinates}>{customer.latitude}, {customer.longitude}</Text></View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function hasCoordinates(customer: Customer) {
  return Number.isFinite(customer.latitude) && Number.isFinite(customer.longitude);
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 30 },
  title: { fontSize: 19, fontWeight: "800", color: "#17201b" },
  body: { color: "#526158", lineHeight: 21, marginVertical: 8 },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 12, marginTop: 8, borderRadius: 8 },
  marker: { minWidth: 34, height: 34, paddingHorizontal: 6, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  incompleteMarker: { backgroundColor: "#d6a800" },
  completedMarker: { backgroundColor: "#1f6b45" },
  markerText: { color: "#fff", fontWeight: "800" },
  details: { flex: 1, marginLeft: 12 },
  name: { fontWeight: "700", fontSize: 16, color: "#17201b" },
  address: { color: "#3f4b44", marginTop: 3 },
  coordinates: { color: "#68756d", marginTop: 4, fontSize: 12 }
});
