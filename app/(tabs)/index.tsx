import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useVehicle } from "../../context/VehicleContext";

export default function FuelScreen() {
  const { activeVehicle } = useVehicle();
  const [odo, setOdo] = useState("");
  const [cost, setCost] = useState("");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const onChangeDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowPicker(Platform.OS === "ios");
    setDate(currentDate);
  };

  const saveLog = async () => {
    if (!activeVehicle) return;
    if (!odo || !cost || !price) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    const newLog = {
      id: Date.now().toString(),
      date: date.toLocaleDateString(),
      isoDate: date.toISOString(),
      odo: Number(odo),
      cost: Number(cost),
      price: Number(price),
    };

    try {
      const storageKey = `fuelLogs_${activeVehicle.id}`;
      const existing = await AsyncStorage.getItem(storageKey);
      const logs = existing ? JSON.parse(existing) : [];
      await AsyncStorage.setItem(storageKey, JSON.stringify([newLog, ...logs]));

      setOdo("");
      setCost("");
      setPrice("");
      setDate(new Date());
      Alert.alert("Success", `Saved to ${activeVehicle.name}!`);
    } catch (e) {
      Alert.alert("Error", "Failed to save data");
    }
  };

  if (!activeVehicle)
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.header}>⛽ Add Fuel</Text>
        <Text style={styles.subHeader}>Adding for: {activeVehicle.name}</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date</Text>
          <TouchableOpacity
            style={styles.dateBtn}
            onPress={() => setShowPicker(true)}
          >
            <Text style={styles.dateText}>📅 {date.toLocaleDateString()}</Text>
          </TouchableOpacity>
          {showPicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={onChangeDate}
            />
          )}

          <Text style={styles.label}>Odometer (km)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 15280"
            placeholderTextColor="#aaa"
            keyboardType="numeric"
            value={odo}
            onChangeText={setOdo}
          />

          <Text style={styles.label}>Total Cost (Rs.)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 1000"
            placeholderTextColor="#aaa"
            keyboardType="numeric"
            value={cost}
            onChangeText={setCost}
          />

          <Text style={styles.label}>Fuel Price (per Liter)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 300"
            placeholderTextColor="#aaa"
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
          />

          <TouchableOpacity style={styles.button} onPress={saveLog}>
            <Text style={styles.buttonText}>Save Log</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f4f4" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContainer: { padding: 20 },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  subHeader: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  inputGroup: {
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
    fontSize: 16,
  },
  dateBtn: {
    backgroundColor: "#e8f6f3",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#1abc9c",
    alignItems: "center",
  },
  dateText: { fontSize: 16, fontWeight: "bold", color: "#16a085" },
  button: {
    backgroundColor: "#2980b9",
    padding: 18,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
