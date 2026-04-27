import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
// IMPORTANT: Up two levels to reach context
import { useVehicle } from "../../context/VehicleContext";

export default function VehicleHeader() {
  const { vehicles, activeVehicle, switchVehicle, addVehicle } = useVehicle();
  const [modalVisible, setModalVisible] = useState(false);
  const [newMode, setNewMode] = useState(false);
  const [newName, setNewName] = useState("");

  const handleAdd = () => {
    if (newName.trim()) {
      addVehicle(newName, "car");
      setNewName("");
      setNewMode(false);
      setModalVisible(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="car-sport" size={24} color="#fff" />
        <View>
          <Text style={styles.label}>Current Profile</Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={styles.activeText}>
              {activeVehicle?.name || "Loading..."}
            </Text>
            <Ionicons
              name="chevron-down"
              size={16}
              color="#fff"
              style={{ marginLeft: 5 }}
            />
          </View>
        </View>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {!newMode ? (
              <>
                <Text style={styles.title}>Select Vehicle</Text>
                <FlatList
                  data={vehicles}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.item,
                        item.id === activeVehicle?.id && styles.activeItem,
                      ]}
                      onPress={() => {
                        switchVehicle(item.id);
                        setModalVisible(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.itemText,
                          item.id === activeVehicle?.id &&
                            styles.activeItemText,
                        ]}
                      >
                        {item.name}
                      </Text>
                      {item.id === activeVehicle?.id && (
                        <Ionicons name="checkmark" size={20} color="#2980b9" />
                      )}
                    </TouchableOpacity>
                  )}
                />
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => setNewMode(true)}
                >
                  <Ionicons name="add-circle" size={24} color="#fff" />
                  <Text style={styles.addBtnText}>Add New Vehicle</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={styles.closeBtn}
                >
                  <Text style={{ color: "#666" }}>Close</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.title}>New Vehicle Profile</Text>
                <Text style={styles.subLabel}>
                  Give your vehicle a name (e.g. Red Bike)
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Vehicle Name"
                  value={newName}
                  onChangeText={setNewName}
                  placeholderTextColor="#999"
                  autoFocus
                />
                <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
                  <Text style={styles.addBtnText}>Create Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setNewMode(false)}
                  style={styles.closeBtn}
                >
                  <Text style={{ color: "#666" }}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 70,
    backgroundColor: "#2980b9",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingTop: 5,
  },
  selector: { flexDirection: "row", alignItems: "center", gap: 15 },
  label: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    textTransform: "uppercase",
    fontWeight: "bold",
  },
  activeText: { color: "#fff", fontSize: 20, fontWeight: "bold" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 25,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  subLabel: { fontSize: 14, color: "#666", marginBottom: 10 },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 18,
    borderBottomWidth: 1,
    borderColor: "#f0f0f0",
    borderRadius: 10,
    marginBottom: 5,
  },
  activeItem: { backgroundColor: "#eef7fc", borderColor: "#2980b9" },
  itemText: { fontSize: 17, color: "#333" },
  activeItemText: { color: "#2980b9", fontWeight: "bold" },

  addBtn: {
    backgroundColor: "#2980b9",
    padding: 18,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
  },
  addBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#f9f9f9",
  },
  closeBtn: { alignItems: "center", marginTop: 15, padding: 10 },
});
