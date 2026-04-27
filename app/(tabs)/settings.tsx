import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  StorageAccessFramework,
  documentDirectory,
  writeAsStringAsync,
} from "expo-file-system/legacy";
import { useFocusEffect } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useVehicle } from "../../context/VehicleContext";

const MONTHS = [
  "All",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function SettingsScreen() {
  const { activeVehicle, deleteVehicle, renameVehicle } = useVehicle();

  // --- Profile Rename State ---
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [newVehicleName, setNewVehicleName] = useState("");

  // --- Filter State ---
  const [allLogs, setAllLogs] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<"All" | "fuel" | "service">(
    "All",
  );
  const [filterYear, setFilterYear] = useState<string>("All");
  const [filterMonth, setFilterMonth] = useState<string>("All");

  // Load all logs when opening the screen
  const loadLogs = async () => {
    if (!activeVehicle) return;
    try {
      const fuelRaw = await AsyncStorage.getItem(
        `fuelLogs_${activeVehicle.id}`,
      );
      const maintRaw = await AsyncStorage.getItem(
        `maintLogs_${activeVehicle.id}`,
      );

      const fuel = fuelRaw
        ? JSON.parse(fuelRaw).map((i: any) => ({ ...i, type: "fuel" }))
        : [];
      const maint = maintRaw
        ? JSON.parse(maintRaw).map((i: any) => ({ ...i, type: "service" }))
        : [];

      const combined = [...fuel, ...maint].sort(
        (a, b) => new Date(b.isoDate).getTime() - new Date(a.isoDate).getTime(),
      );
      setAllLogs(combined);
    } catch (e) {
      console.error(e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadLogs();
    }, [activeVehicle]),
  );

  // Get available years from loaded logs
  const availableYears = useMemo(() => {
    const years = new Set(
      allLogs.map((log) => new Date(log.isoDate).getFullYear().toString()),
    );
    return ["All", ...Array.from(years)].sort((a, b) => b.localeCompare(a));
  }, [allLogs]);

  // Apply filters before downloading
  const filteredLogs = useMemo(() => {
    return allLogs.filter((log) => {
      const logDate = new Date(log.isoDate);
      const matchesType = filterType === "All" || log.type === filterType;
      const matchesYear =
        filterYear === "All" || logDate.getFullYear().toString() === filterYear;
      const matchesMonth =
        filterMonth === "All" || MONTHS[logDate.getMonth() + 1] === filterMonth;
      return matchesType && matchesYear && matchesMonth;
    });
  }, [allLogs, filterType, filterYear, filterMonth]);

  // --- Export Function ---
  const exportFilteredData = async () => {
    if (!activeVehicle) return;

    if (filteredLogs.length === 0) {
      Alert.alert("No Data", "No records match your selected filters.");
      return;
    }

    try {
      // Create a universal CSV Header that supports both Fuel and Maintenance fields
      const csvHeader =
        "Date,Record Type,Total Cost (Rs),Odometer (km),Fuel Price/Ltr,Description\n";

      const csvRows = filteredLogs
        .map((log) => {
          const typeStr = log.type === "fuel" ? "Fuel" : "Service";
          const cost = log.cost || 0;
          const odo = log.odo || "N/A";
          const price = log.price || "N/A";
          const desc = log.desc ? `"${log.desc}"` : "N/A"; // Quotes to prevent comma breaks in CSV

          return `${log.date},${typeStr},${cost},${odo},${price},${desc}`;
        })
        .join("\n");

      const csvContent = csvHeader + csvRows;

      // Dynamic Filename based on filters
      const typeLabel =
        filterType === "All"
          ? "Complete"
          : filterType === "fuel"
            ? "Fuel"
            : "Service";
      const yearLabel = filterYear === "All" ? "" : `_${filterYear}`;
      const monthLabel = filterMonth === "All" ? "" : `_${filterMonth}`;
      const fileName = `${activeVehicle.name.replace(/\s+/g, "_")}_${typeLabel}_Report${yearLabel}${monthLabel}.csv`;

      // Platform Specific Saving
      if (Platform.OS === "android") {
        const permissions =
          await StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
          const fileUri = await StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            fileName,
            "text/csv",
          );
          await writeAsStringAsync(fileUri, csvContent, { encoding: "utf8" });
          Alert.alert("Success", "Report downloaded successfully!");
        } else {
          Alert.alert(
            "Cancelled",
            "You need to select a folder to save the file.",
          );
        }
      } else {
        const fileUri = documentDirectory + fileName;
        await writeAsStringAsync(fileUri, csvContent, { encoding: "utf8" });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: "text/csv",
            dialogTitle: "Save your vehicle report",
          });
        } else {
          Alert.alert(
            "Error",
            "Sharing and Saving is not supported on this device.",
          );
        }
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not export file.");
    }
  };

  const handleRename = () => {
    if (!newVehicleName.trim()) {
      Alert.alert("Error", "Vehicle name cannot be empty.");
      return;
    }
    if (activeVehicle) {
      renameVehicle(activeVehicle.id, newVehicleName.trim());
      setRenameModalVisible(false);
      setNewVehicleName("");
    }
  };

  const confirmDelete = () => {
    if (activeVehicle) {
      Alert.alert(
        "Delete Profile",
        "This will delete all data for this vehicle. Are you sure?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => deleteVehicle(activeVehicle.id),
          },
        ],
      );
    }
  };

  if (!activeVehicle) return null;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Settings</Text>

      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Setup</Text>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => {
            setNewVehicleName(activeVehicle.name);
            setRenameModalVisible(true);
          }}
        >
          <Text style={styles.btnText}>✏️ Rename Vehicle</Text>
        </TouchableOpacity>
      </View>

      {/* Export Section with Filters */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Custom Report Download</Text>

        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Select Type</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
          >
            {["All", "fuel", "service"].map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.chip, filterType === type && styles.chipActive]}
                onPress={() => setFilterType(type as any)}
              >
                <Text
                  style={[
                    styles.chipText,
                    filterType === type && styles.chipTextActive,
                  ]}
                >
                  {type === "All"
                    ? "All Types"
                    : type === "fuel"
                      ? "⛽ Fuel"
                      : "🔧 Service"}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.filterLabel}>Select Year</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
          >
            {availableYears.map((year) => (
              <TouchableOpacity
                key={year}
                style={[styles.chip, filterYear === year && styles.chipActive]}
                onPress={() => setFilterYear(year)}
              >
                <Text
                  style={[
                    styles.chipText,
                    filterYear === year && styles.chipTextActive,
                  ]}
                >
                  {year === "All" ? "📅 All Years" : year}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.filterLabel}>Select Month</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
          >
            {MONTHS.map((month) => (
              <TouchableOpacity
                key={month}
                style={[
                  styles.chip,
                  filterMonth === month && styles.chipActive,
                ]}
                onPress={() => setFilterMonth(month)}
              >
                <Text
                  style={[
                    styles.chipText,
                    filterMonth === month && styles.chipTextActive,
                  ]}
                >
                  {month === "All" ? "🗓 All Months" : month}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <TouchableOpacity
          style={styles.downloadBtn}
          onPress={exportFilteredData}
        >
          <Text style={styles.downloadBtnText}>
            📥 Download Report ({filteredLogs.length} Records)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Danger Zone */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Danger Zone</Text>
        <TouchableOpacity
          style={[styles.btn, styles.dangerBtn]}
          onPress={confirmDelete}
        >
          <Text style={[styles.btnText, styles.dangerText]}>
            🗑️ Delete Vehicle
          </Text>
        </TouchableOpacity>
      </View>

      {/* Rename Modal */}
      <Modal visible={renameModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rename Vehicle</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter new name"
              value={newVehicleName}
              onChangeText={setNewVehicleName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setRenameModalVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={handleRename}
              >
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f4f4", padding: 20 },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  section: { marginBottom: 30 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#666",
    marginBottom: 10,
    textTransform: "uppercase",
  },

  btn: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "center",
    elevation: 1,
  },
  btnText: { fontSize: 16, fontWeight: "600", color: "#333" },

  dangerBtn: {
    backgroundColor: "#fff0f0",
    borderWidth: 1,
    borderColor: "#ffcccc",
  },
  dangerText: { color: "#d32f2f" },

  // Filter Styles
  filterContainer: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 1,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#999",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  filterScroll: { marginBottom: 15 },
  chip: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  chipActive: { backgroundColor: "#eef7fc", borderColor: "#2980b9" },
  chipText: { color: "#666", fontWeight: "600", fontSize: 13 },
  chipTextActive: { color: "#2980b9", fontWeight: "bold" },

  downloadBtn: {
    backgroundColor: "#2980b9",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
  },
  downloadBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: { backgroundColor: "#fff", borderRadius: 15, padding: 25 },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: "#f9f9f9",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  modalBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: "center" },
  cancelBtn: { backgroundColor: "#f0f0f0" },
  saveBtn: { backgroundColor: "#2980b9" },
  cancelText: { color: "#555", fontWeight: "bold", fontSize: 16 },
  saveText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
