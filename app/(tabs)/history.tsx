import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
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

export default function HistoryScreen() {
  const { activeVehicle } = useVehicle();
  const [logs, setLogs] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // --- Filter States ---
  const [filterType, setFilterType] = useState<"All" | "fuel" | "service">(
    "All",
  );
  const [filterYear, setFilterYear] = useState<string>("All");
  const [filterMonth, setFilterMonth] = useState<string>("All");
  const [showFilters, setShowFilters] = useState(false);

  // --- Modal State ---
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [editCost, setEditCost] = useState("");
  const [editOdo, setEditOdo] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const loadData = async () => {
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

      // Sort by newest first
      const combined = [...fuel, ...maint].sort(
        (a, b) => new Date(b.isoDate).getTime() - new Date(a.isoDate).getTime(),
      );

      setLogs(combined);
    } catch (e) {
      console.error(e);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData().then(() => setRefreshing(false));
  }, [activeVehicle]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [activeVehicle]),
  );

  // --- FILTER LOGIC ---
  // Get unique years from the logs to show in the filter bar
  const availableYears = useMemo(() => {
    const years = new Set(
      logs.map((log) => new Date(log.isoDate).getFullYear().toString()),
    );
    return ["All", ...Array.from(years)].sort((a, b) => b.localeCompare(a)); // Sort newest year first
  }, [logs]);

  // Apply filters to the list
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const logDate = new Date(log.isoDate);

      const matchesType = filterType === "All" || log.type === filterType;
      const matchesYear =
        filterYear === "All" || logDate.getFullYear().toString() === filterYear;
      const matchesMonth =
        filterMonth === "All" || MONTHS[logDate.getMonth() + 1] === filterMonth;

      return matchesType && matchesYear && matchesMonth;
    });
  }, [logs, filterType, filterYear, filterMonth]);

  // --- DELETE LOGIC ---
  const deleteLog = (item: any) => {
    Alert.alert("Delete Record", "Are you sure you want to delete this?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const storageKey =
              item.type === "fuel"
                ? `fuelLogs_${activeVehicle?.id}`
                : `maintLogs_${activeVehicle?.id}`;
            const raw = await AsyncStorage.getItem(storageKey);
            const list = raw ? JSON.parse(raw) : [];
            const updatedList = list.filter((log: any) => log.id !== item.id);
            await AsyncStorage.setItem(storageKey, JSON.stringify(updatedList));
            loadData();
          } catch (e) {
            console.error("Delete failed", e);
          }
        },
      },
    ]);
  };

  // --- EDIT LOGIC ---
  const openEditModal = (item: any) => {
    setEditItem(item);
    setEditCost(item.cost.toString());
    setEditOdo(item.odo ? item.odo.toString() : "");
    setEditDesc(item.type === "service" ? item.desc : "");
    setModalVisible(true);
  };

  const saveEdit = async () => {
    if (!editItem || !activeVehicle) return;

    try {
      const storageKey =
        editItem.type === "fuel"
          ? `fuelLogs_${activeVehicle.id}`
          : `maintLogs_${activeVehicle.id}`;
      const raw = await AsyncStorage.getItem(storageKey);
      const list = raw ? JSON.parse(raw) : [];

      const updatedList = list.map((log: any) => {
        if (log.id === editItem.id) {
          return {
            ...log,
            cost: Number(editCost),
            odo: editOdo ? Number(editOdo) : null,
            desc: editItem.type === "service" ? editDesc : undefined,
          };
        }
        return log;
      });

      await AsyncStorage.setItem(storageKey, JSON.stringify(updatedList));
      setModalVisible(false);
      loadData();
    } catch (e) {
      Alert.alert("Error", "Could not update record");
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconBox}>
          <Ionicons
            name={item.type === "fuel" ? "water" : "construct"}
            size={24}
            color={item.type === "fuel" ? "#2980b9" : "#c0392b"}
          />
        </View>
        <View style={styles.info}>
          <Text style={styles.title}>
            {item.type === "fuel" ? "Fuel Refill" : item.desc}
          </Text>
          <Text style={styles.date}>{item.date}</Text>
        </View>
        <View style={styles.amount}>
          <Text style={styles.cost}>Rs. {item.cost}</Text>
          {item.odo ? <Text style={styles.odo}>{item.odo} km</Text> : null}
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => openEditModal(item)}
        >
          <Ionicons name="create-outline" size={18} color="#2980b9" />
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => deleteLog(item)}
        >
          <Ionicons name="trash-outline" size={18} color="#c0392b" />
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>History</Text>
        <TouchableOpacity
          style={styles.filterToggleButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons
            name="filter"
            size={16}
            color={showFilters ? "#fff" : "#2980b9"}
          />
          <Text
            style={[styles.filterToggleText, showFilters && { color: "#fff" }]}
          >
            {showFilters ? "Hide Filters" : "Filter"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* FILTER SECTION */}
      {showFilters && (
        <View style={styles.filterContainer}>
          {/* Type Filter */}
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

          {/* Year Filter */}
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

          {/* Month Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={[styles.filterScroll, { marginBottom: 0 }]}
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
      )}

      <FlatList
        data={filteredLogs}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20, paddingTop: 10 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>No records match your filters.</Text>
        }
      />

      {/* Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Entry</Text>
            {editItem?.type === "service" && (
              <>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={styles.input}
                  value={editDesc}
                  onChangeText={setEditDesc}
                />
              </>
            )}
            <Text style={styles.label}>Cost (Rs)</Text>
            <TextInput
              style={styles.input}
              value={editCost}
              keyboardType="numeric"
              onChangeText={setEditCost}
            />
            <Text style={styles.label}>Odometer (km)</Text>
            <TextInput
              style={styles.input}
              value={editOdo}
              keyboardType="numeric"
              onChangeText={setEditOdo}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={saveEdit}>
                <Text style={styles.saveText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f4",
    paddingHorizontal: 15,
    paddingTop: 15,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  header: { fontSize: 24, fontWeight: "bold", color: "#333" },

  // Toggle Filters Button
  filterToggleButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eef7fc",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
  },
  filterToggleText: { color: "#2980b9", fontWeight: "bold", fontSize: 13 },

  // Filters Area
  filterContainer: {
    backgroundColor: "#fff",
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
  },
  filterScroll: { paddingHorizontal: 10, marginBottom: 12 },
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

  // Card Styles
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    overflow: "hidden",
  },
  cardHeader: { flexDirection: "row", padding: 15, alignItems: "center" },
  iconBox: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  info: { flex: 1 },
  title: { fontSize: 16, fontWeight: "bold", color: "#333" },
  date: { fontSize: 12, color: "#888", marginTop: 2 },
  amount: { alignItems: "flex-end" },
  cost: { fontSize: 16, fontWeight: "bold", color: "#2c3e50" },
  odo: { fontSize: 12, color: "#888" },

  // Action Buttons
  actionRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderColor: "#f0f0f0",
  },
  editBtn: {
    flex: 1,
    padding: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },
  deleteBtn: {
    flex: 1,
    padding: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },
  divider: { width: 1, backgroundColor: "#f0f0f0" },
  editText: { color: "#2980b9", fontWeight: "bold", fontSize: 14 },
  deleteText: { color: "#c0392b", fontWeight: "bold", fontSize: 14 },

  empty: { textAlign: "center", marginTop: 50, color: "#999", fontSize: 16 },

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
    marginBottom: 20,
  },
  label: { fontSize: 14, fontWeight: "bold", color: "#555", marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  modalButtons: { flexDirection: "row", gap: 10, marginTop: 10 },
  cancelButton: {
    flex: 1,
    padding: 15,
    backgroundColor: "#eee",
    borderRadius: 10,
    alignItems: "center",
  },
  saveButton: {
    flex: 1,
    padding: 15,
    backgroundColor: "#2980b9",
    borderRadius: 10,
    alignItems: "center",
  },
  cancelText: { fontWeight: "bold", color: "#555" },
  saveText: { fontWeight: "bold", color: "#fff" },
});
