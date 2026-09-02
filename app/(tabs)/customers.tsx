import { useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { CustomerRow } from "@/components/CustomerRow";
import { useRouteState } from "@/hooks/useRouteState";

export default function CustomersScreen() {
  const { customers } = useRouteState();
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return customers.filter((customer) => !term || customer.label.toLowerCase().includes(term) || customer.address.toLowerCase().includes(term) || String(customer.route_order).includes(term));
  }, [customers, query]);
  return <View style={styles.screen}><Text style={styles.title}>Customers</Text><TextInput value={query} onChangeText={setQuery} placeholder="Search name, address, or route #" style={styles.search} /><FlatList data={filtered} keyExtractor={(item) => item.id} renderItem={({ item }) => <CustomerRow customer={item} onPress={() => router.push(`/customer/${item.id}`)} />} /></View>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: "#f5f7f5", paddingTop: 58 }, title: { fontSize: 24, fontWeight: "800", paddingHorizontal: 16, color: "#17201b" }, search: { margin: 16, padding: 13, borderRadius: 8, backgroundColor: "#fff", borderWidth: 1, borderColor: "#d1dbd4", fontSize: 16 } });
