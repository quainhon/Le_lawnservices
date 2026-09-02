import { router } from "expo-router";
import MapView, { Callout, Marker } from "react-native-maps";
import { StyleSheet, Text, View } from "react-native";
import { Customer, ServiceJob } from "@/domain/types";

export default function RouteMap({ customers, jobs }: { customers: Customer[]; jobs: ServiceJob[] }) {
  const validCustomers = customers.filter(hasCoordinates);
  const isCompleted = (customerId: string) => jobs.some((job) => job.customer_id === customerId && job.completed_at);
  return (
    <MapView style={styles.map} initialRegion={getRegion(validCustomers)}>
      {validCustomers.map((customer) => (
        <Marker key={customer.id} coordinate={{ latitude: customer.latitude, longitude: customer.longitude }}>
          <View style={[styles.marker, isCompleted(customer.id) ? styles.completedMarker : styles.incompleteMarker]}><Text style={styles.markerText}>{customer.route_order}</Text></View>
          <Callout onPress={() => router.push(`/customer/${customer.id}`)}>
            <View style={styles.callout}>
              <Text style={styles.route}>#{customer.route_order}</Text>
              <Text style={styles.name}>{customer.label}</Text>
              <Text>{customer.address}</Text>
              <Text>{formatFrequency(customer)}</Text>
              <Text style={styles.action}>Open customer detail</Text>
            </View>
          </Callout>
        </Marker>
      ))}
    </MapView>
  );
}

function hasCoordinates(customer: Customer) {
  return Number.isFinite(customer.latitude) && Number.isFinite(customer.longitude);
}

function getRegion(customers: Customer[]) {
  const latitudes = customers.map((customer) => customer.latitude);
  const longitudes = customers.map((customer) => customer.longitude);
  const minLat = Math.min(...latitudes), maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes), maxLng = Math.max(...longitudes);
  return { latitude: (minLat + maxLat) / 2, longitude: (minLng + maxLng) / 2, latitudeDelta: Math.max(maxLat - minLat, 0.02) * 1.25, longitudeDelta: Math.max(maxLng - minLng, 0.02) * 1.25 };
}

function formatFrequency(customer: Customer) {
  return customer.frequency === "weekly" ? "Weekly" : `Biweekly ${customer.biweekly_cycle}`;
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  marker: { minWidth: 34, height: 34, paddingHorizontal: 6, borderRadius: 17, borderWidth: 2, borderColor: "#fff", alignItems: "center", justifyContent: "center" },
  incompleteMarker: { backgroundColor: "#d6a800" },
  completedMarker: { backgroundColor: "#1f6b45" },
  markerText: { color: "#fff", fontWeight: "800" },
  callout: { width: 220, padding: 4 },
  route: { color: "#1f6b45", fontWeight: "800", fontSize: 16 },
  name: { fontWeight: "700", fontSize: 16, color: "#17201b" },
  action: { color: "#1f6b45", fontWeight: "700", marginTop: 6 }
});
