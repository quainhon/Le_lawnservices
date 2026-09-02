import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: "#1f6b45", tabBarLabelStyle: { fontSize: 12 } }}>
      <Tabs.Screen name="index" options={{ title: "Route", tabBarIcon: () => <Text>R</Text> }} />
      <Tabs.Screen name="map" options={{ title: "Map", tabBarIcon: () => <Text>M</Text> }} />
      <Tabs.Screen name="customers" options={{ title: "Customers", tabBarIcon: () => <Text>C</Text> }} />
      <Tabs.Screen name="settings" options={{ title: "Settings", tabBarIcon: () => <Text>S</Text> }} />
    </Tabs>
  );
}
