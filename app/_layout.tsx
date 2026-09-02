import { Stack } from "expo-router";
import { RouteStateProvider } from "@/hooks/useRouteState";

export default function RootLayout() {
  return <RouteStateProvider><Stack screenOptions={{ headerShown: false }} /></RouteStateProvider>;
}
