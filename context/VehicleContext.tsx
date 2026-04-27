import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";

interface Vehicle {
  id: string;
  name: string;
  type: "car" | "bike" | "truck";
}

interface VehicleContextType {
  vehicles: Vehicle[];
  activeVehicle: Vehicle | null;
  addVehicle: (name: string, type: "car" | "bike" | "truck") => void;
  switchVehicle: (id: string) => void;
  deleteVehicle: (id: string) => void;
  renameVehicle: (id: string, newName: string) => void; // <-- NEW
  isLoading: boolean;
}

const VehicleContext = createContext<VehicleContextType>({} as any);

export const VehicleProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeVehicle, setActiveVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const storedVehicles = await AsyncStorage.getItem("vehicles");
      const storedActiveId = await AsyncStorage.getItem("activeVehicleId");

      let parsedVehicles: Vehicle[] = storedVehicles
        ? JSON.parse(storedVehicles)
        : [];

      if (parsedVehicles.length === 0) {
        // Create default vehicle if none exists
        const defaultVehicle: Vehicle = {
          id: Date.now().toString(),
          name: "My Car",
          type: "car",
        };
        parsedVehicles = [defaultVehicle];
        await AsyncStorage.setItem("vehicles", JSON.stringify(parsedVehicles));
        await AsyncStorage.setItem("activeVehicleId", defaultVehicle.id);
      }

      setVehicles(parsedVehicles);

      const active = parsedVehicles.find((v) => v.id === storedActiveId);
      setActiveVehicle(active || parsedVehicles[0]);
    } catch (e) {
      console.error("Failed to load vehicles", e);
    } finally {
      setIsLoading(false);
    }
  };

  const addVehicle = async (name: string, type: "car" | "bike" | "truck") => {
    const newVehicle: Vehicle = { id: Date.now().toString(), name, type };
    const updatedList = [...vehicles, newVehicle];
    setVehicles(updatedList);
    await AsyncStorage.setItem("vehicles", JSON.stringify(updatedList));
    setActiveVehicle(newVehicle);
    await AsyncStorage.setItem("activeVehicleId", newVehicle.id);
  };

  const switchVehicle = async (id: string) => {
    const target = vehicles.find((v) => v.id === id);
    if (target) {
      setActiveVehicle(target);
      await AsyncStorage.setItem("activeVehicleId", id);
    }
  };

  // --- NEW RENAME FUNCTION ---
  const renameVehicle = async (id: string, newName: string) => {
    const updatedVehicles = vehicles.map((v) =>
      v.id === id ? { ...v, name: newName } : v,
    );
    setVehicles(updatedVehicles);
    await AsyncStorage.setItem("vehicles", JSON.stringify(updatedVehicles));

    if (activeVehicle?.id === id) {
      setActiveVehicle({ ...activeVehicle, name: newName });
    }
  };

  const deleteVehicle = async (id: string) => {
    if (vehicles.length <= 1) {
      Alert.alert("Error", "You cannot delete your only vehicle profile.");
      return;
    }

    Alert.alert(
      "Delete Vehicle",
      "This will permanently delete this vehicle and all its logs. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const updatedList = vehicles.filter((v) => v.id !== id);
            setVehicles(updatedList);

            await AsyncStorage.removeItem(`fuelLogs_${id}`);
            await AsyncStorage.removeItem(`maintLogs_${id}`);

            setActiveVehicle(updatedList[0]);
            await AsyncStorage.setItem("vehicles", JSON.stringify(updatedList));
            await AsyncStorage.setItem("activeVehicleId", updatedList[0].id);
          },
        },
      ],
    );
  };

  return (
    <VehicleContext.Provider
      value={{
        vehicles,
        activeVehicle,
        addVehicle,
        switchVehicle,
        deleteVehicle,
        renameVehicle, // <-- EXPORTED
        isLoading,
      }}
    >
      {children}
    </VehicleContext.Provider>
  );
};

export const useVehicle = () => useContext(VehicleContext);
