import { Stack } from "expo-router";
import { StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"; // Updated Import
import VehicleHeader from "../components/ui/VehicleHeader";
import { VehicleProvider } from "../context/VehicleContext";

export default function RootLayout() {
  return (
    <VehicleProvider>
      <SafeAreaView
        style={{ flex: 0, backgroundColor: "#2980b9" }}
        edges={["top"]}
      />
      <StatusBar barStyle="light-content" backgroundColor="#2980b9" />
      <VehicleHeader />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </VehicleProvider>
  );
}
