import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useVehicle } from "../../context/VehicleContext";

export default function MaintScreen() {
  const { activeVehicle } = useVehicle();
  const [desc, setDesc] = useState("");
  const [cost, setCost] = useState("");
  const [odo, setOdo] = useState("");

  const saveMaint = async () => {
    if (!activeVehicle) return;
    if (!desc || !cost) {
      Alert.alert("Error", "Fill Description and Cost");
      return;
    }

    const newMaint = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      isoDate: new Date().toISOString(),
      desc,
      cost: Number(cost),
      odo: odo ? Number(odo) : null,
    };

    try {
      const key = `maintLogs_${activeVehicle.id}`;
      const existing = await AsyncStorage.getItem(key);
      const logs = existing ? JSON.parse(existing) : [];
      await AsyncStorage.setItem(key, JSON.stringify([newMaint, ...logs]));

      setDesc("");
      setCost("");
      setOdo("");
      Alert.alert("Success", "Service record saved!");
    } catch (e) {
      Alert.alert("Error", "Save failed");
    }
  };

  if (!activeVehicle) return null;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>🔧 Add Service</Text>
      <Text style={styles.subHeader}>For: {activeVehicle.name}</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Service Description</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Oil Change"
          value={desc}
          onChangeText={setDesc}
        />

        <Text style={styles.label}>Cost (Rs.)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 8500"
          keyboardType="numeric"
          value={cost}
          onChangeText={setCost}
        />

        <Text style={styles.label}>Odometer (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 15000"
          keyboardType="numeric"
          value={odo}
          onChangeText={setOdo}
        />

        <TouchableOpacity style={styles.button} onPress={saveMaint}>
          <Text style={styles.buttonText}>Save Service</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f4f4", padding: 20 },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
  },
  subHeader: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    elevation: 2,
  },
  label: { fontSize: 14, fontWeight: "bold", color: "#555", marginBottom: 5 },
  input: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#eee",
  },
  button: {
    backgroundColor: "#c0392b",
    padding: 18,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
