import { useMemo, useState } from "react";
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useAppContext } from "@/state/AppContext";
import { getServiceJobTotal, selectActiveJobs, selectActiveWeek, selectCustomerById, selectCustomerPaymentHistory } from "@/domain/selectors";
import { Customer } from "@/domain/types";

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, dispatch, loaded } = useAppContext();
  const cycle = selectActiveWeek(state).cycle;
  const jobs = selectActiveJobs(state);
  const [price, setPrice] = useState("");
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [adjustmentNote, setAdjustmentNote] = useState("");
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
  const customer = useMemo(() => selectCustomerById(state, id), [state, id]);
  const customerPaymentHistory = useMemo(
    () => selectCustomerPaymentHistory(state, id),
    [state, id]
  );

  if (!loaded) return null;
  if (!customer) {
    return <View style={styles.center}><Text>Customer not found.</Text><Pressable onPress={() => router.back()}><Text style={styles.backLink}>Back</Text></Pressable></View>;
  }

  const completed = jobs.some((job) => job.customer_id === customer.id && job.completed_at);
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹ Back</Text></Pressable>
      <Text style={styles.routeNumber}>#{String(customer.route_order).padStart(3, "0")}</Text>
      <Text style={styles.name}>{customer.label}</Text>
      <Text style={styles.address}>{customer.address}</Text>
      <Info label="Frequency" value={customer.frequency === "weekly" ? "Weekly" : `Biweekly ${customer.biweekly_cycle}`} />
      <Info label="Status" value={customer.status} />
      <Text style={styles.priceLabel}>Service price (prototype)</Text>
      <View style={styles.priceRow}>
        <TextInput value={price || String(customer.service_price ?? "")} onChangeText={setPrice} keyboardType="decimal-pad" style={styles.priceInput} />
        <Pressable onPress={() => { const value = Number(price || customer.service_price); if (Number.isFinite(value)) { dispatch({ type: "UPDATE_CUSTOMER_PRICE", customerId: customer.id, price: value }); setPrice(String(value)); } }} style={styles.savePrice}><Text style={styles.savePriceText}>SAVE</Text></Pressable>
      </View>
      <Text style={styles.historyTitle}>Payment History</Text>
      {customerPaymentHistory.map((charge) => (
        <Pressable key={charge.id} style={styles.paymentRow}>
          <Text style={styles.paymentDate}>{formatDateTime(charge.completed_at)}</Text>
          <Text style={styles.paymentAmount}>${getServiceJobTotal(charge).toFixed(2)}</Text>
          <Text style={styles.paymentWeek}>Service week: {charge.week_id}</Text>
          <Text style={charge.billing_status === "paid" ? styles.paidStatus : styles.unpaidStatus}>
            {charge.billing_status === "paid" ? `PAID ${formatDate(charge.paid_at)}` : "UNPAID"}
          </Text>
        </Pressable>
      ))}
      {!customerPaymentHistory.length && <Text style={styles.emptyHistory}>No completed service jobs yet.</Text>}
      {(() => {
        const currentJob = jobs.find((job) => job.customer_id === customer.id);
        if (!currentJob || !currentJob.completed_at) return null;
        const base = currentJob.service_price_at_service ?? 0;
        const extra = currentJob.adjustments.reduce((sum, adjustment) => sum + adjustment.amount, 0);
        return <View style={styles.billingBox}>
          <Text style={styles.billingLine}>Base service: ${base.toFixed(2)}</Text>
          <Text style={styles.billingLine}>Extra charges: +${extra.toFixed(2)}</Text>
          <Text style={styles.billingTotal}>This week total: ${getServiceJobTotal(currentJob).toFixed(2)}</Text>
          {currentJob.billing_status === "unpaid" && <>
            <Pressable onPress={() => { setAdjustmentAmount(""); setAdjustmentNote(""); setShowAdjustmentForm(true); }} style={styles.addCharge}><Text style={styles.addChargeText}>+ ADD CHARGE</Text></Pressable>
            {showAdjustmentForm && <View style={styles.adjustmentForm}>
              <TextInput value={adjustmentAmount} onChangeText={setAdjustmentAmount} keyboardType="decimal-pad" placeholder="Amount" style={styles.adjustmentInput} />
              <TextInput value={adjustmentNote} onChangeText={setAdjustmentNote} placeholder="Note (optional)" style={styles.adjustmentInput} />
              <Pressable onPress={() => { const amount = Number(adjustmentAmount); if (Number.isFinite(amount) && amount > 0) { dispatch({ type: "ADD_JOB_ADJUSTMENT", jobId: currentJob.id, amount, note: adjustmentNote }); setAdjustmentAmount(""); setAdjustmentNote(""); setShowAdjustmentForm(false); } }} style={styles.saveAdjustment}><Text style={styles.savePriceText}>SAVE CHARGE</Text></Pressable>
            </View>}
            {currentJob.adjustments.map((adjustment) => <View key={adjustment.id} style={styles.adjustmentRow}><Text style={styles.adjustmentText}>+${adjustment.amount.toFixed(2)}{adjustment.note ? ` · ${adjustment.note}` : ""}</Text><Pressable onPress={() => dispatch({ type: "REMOVE_JOB_ADJUSTMENT", jobId: currentJob.id, adjustmentId: adjustment.id })}><Text style={styles.removeAdjustment}>REMOVE</Text></Pressable></View>)}
          </>}
        </View>;
      })()}
      <Pressable onPress={() => dispatch({ type: "TOGGLE_JOB", customerId: customer.id })} style={[styles.doneButton, completed && styles.undoButton]}>
        <Text style={styles.buttonText}>{completed ? "UNDO" : "DONE"}</Text>
      </Pressable>
      <Pressable onPress={() => openNavigation(customer)} style={styles.navigateButton}>
        <Text style={styles.navigateText}>NAVIGATE</Text>
      </Pressable>
      <Text style={styles.cycleNote}>Completion is tracked for Week {cycle}.</Text>
    </ScrollView>
  );
}

function formatDateTime(value: string | null) {
  return value ? new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "";
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "";
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
  priceLabel: { fontSize: 13, color: "#68756d", textTransform: "uppercase", fontWeight: "700", marginTop: 10, marginBottom: 6 },
  priceRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  priceInput: { flex: 1, backgroundColor: "#fff", borderRadius: 8, borderWidth: 1, borderColor: "#d1dbd4", padding: 14, fontSize: 18 },
  savePrice: { backgroundColor: "#1f6b45", borderRadius: 8, padding: 15 },
  savePriceText: { color: "#fff", fontWeight: "800" },
  historyTitle: { fontSize: 20, fontWeight: "800", color: "#17201b", marginTop: 28, marginBottom: 10 },
  paymentRow: { backgroundColor: "#fff", borderRadius: 8, padding: 14, marginTop: 8 },
  paymentDate: { fontSize: 15, fontWeight: "700", color: "#17201b" },
  paymentAmount: { fontSize: 17, fontWeight: "800", color: "#17201b", marginTop: 5 },
  paymentWeek: { color: "#68756d", fontSize: 12, marginTop: 4 },
  paidStatus: { color: "#1f6b45", fontWeight: "800", marginTop: 4 },
  unpaidStatus: { color: "#a07800", fontWeight: "800", marginTop: 4 },
  emptyHistory: { color: "#68756d" },
  billingBox: { backgroundColor: "#fff", borderRadius: 8, padding: 14, marginTop: 12 },
  billingLine: { color: "#3f4b44", marginBottom: 5 },
  billingTotal: { fontWeight: "800", color: "#17201b", marginTop: 3 },
  addCharge: { backgroundColor: "#1f6b45", borderRadius: 7, padding: 12, marginTop: 12, alignItems: "center" },
  addChargeText: { color: "#fff", fontWeight: "800" },
  adjustmentForm: { marginTop: 10, gap: 8 },
  adjustmentInput: { borderWidth: 1, borderColor: "#d1dbd4", borderRadius: 7, padding: 11, backgroundColor: "#f8faf8" },
  saveAdjustment: { backgroundColor: "#17201b", borderRadius: 7, padding: 12, alignItems: "center" },
  adjustmentRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  adjustmentText: { color: "#3f4b44", flex: 1 },
  removeAdjustment: { color: "#9b2c2c", fontSize: 11, fontWeight: "800" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14 },
  backLink: { color: "#1f6b45", fontWeight: "700" }
});
