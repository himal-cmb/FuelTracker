import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { useVehicle } from "../../context/VehicleContext";

export default function AnalysisScreen() {
  const { activeVehicle } = useVehicle();
  const [totalCost, setTotalCost] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [avgMileage, setAvgMileage] = useState("0");
  const [chartData, setChartData] = useState<any[]>([{ value: 0 }]);
  const [refreshing, setRefreshing] = useState(false);

  // New state for tables
  const [recentFuel, setRecentFuel] = useState<any[]>([]);
  const [recentMaint, setRecentMaint] = useState<any[]>([]);

  const calculateStats = async () => {
    if (!activeVehicle) return;
    try {
      // --- Fuel Logic ---
      const fuelRaw = await AsyncStorage.getItem(
        `fuelLogs_${activeVehicle.id}`,
      );
      const logs = fuelRaw ? JSON.parse(fuelRaw) : [];

      // Sort Newest -> Oldest for the table
      const newestFuel = [...logs]
        .sort(
          (a: any, b: any) =>
            new Date(b.isoDate).getTime() - new Date(a.isoDate).getTime(),
        )
        .slice(0, 5);
      setRecentFuel(newestFuel);

      if (logs.length === 0) {
        setChartData([{ value: 0 }]);
        setTotalCost(0);
      } else {
        // Sort Oldest -> Newest for calculations/chart
        const sortedLogs = [...logs].sort(
          (a: any, b: any) =>
            new Date(a.isoDate).getTime() - new Date(b.isoDate).getTime(),
        );

        const totalSpent = sortedLogs.reduce(
          (sum: number, item: any) => sum + (item.cost || 0),
          0,
        );
        const startOdo = sortedLogs[0].odo;
        const endOdo = sortedLogs[sortedLogs.length - 1].odo;
        const dist = endOdo - startOdo;

        const dataPoints = [];
        let validLiters = 0;

        for (let i = 1; i < sortedLogs.length; i++) {
          const cur = sortedLogs[i];
          const prev = sortedLogs[i - 1];
          const distDiff = cur.odo - prev.odo;
          const liters = cur.cost / cur.price;

          if (distDiff > 0 && liters > 0) {
            const kmPerLiter = distDiff / liters;
            validLiters += liters;
            dataPoints.push({
              value: parseFloat(kmPerLiter.toFixed(1)),
              label: new Date(cur.isoDate).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
              }),
            });
          }
        }
        setTotalDistance(dist > 0 ? dist : 0);
        setAvgMileage(validLiters > 0 ? (dist / validLiters).toFixed(1) : "0");
        if (dataPoints.length > 0) setChartData(dataPoints);
      }

      // --- Maintenance Logic ---
      const maintRaw = await AsyncStorage.getItem(
        `maintLogs_${activeVehicle.id}`,
      );
      const maintLogs = maintRaw ? JSON.parse(maintRaw) : [];

      const newestMaint = [...maintLogs]
        .sort(
          (a: any, b: any) =>
            new Date(b.isoDate).getTime() - new Date(a.isoDate).getTime(),
        )
        .slice(0, 5);
      setRecentMaint(newestMaint);

      const fuelSpent = logs.reduce(
        (sum: number, item: any) => sum + (item.cost || 0),
        0,
      );
      const mCost = maintLogs.reduce(
        (sum: number, item: any) => sum + (item.cost || 0),
        0,
      );
      setTotalCost(fuelSpent + mCost);
    } catch (e) {
      console.error(e);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    calculateStats().then(() => setRefreshing(false));
  }, [activeVehicle]);

  useFocusEffect(
    useCallback(() => {
      calculateStats();
    }, [activeVehicle]),
  );

  // Helper component for Table Rows
  const LogTable = ({
    title,
    data,
    type,
  }: {
    title: string;
    data: any[];
    type: "fuel" | "maint";
  }) => (
    <View style={styles.tableContainer}>
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={styles.tableHeader}>
        <Text style={[styles.columnHeader, { flex: 2 }]}>Date</Text>
        <Text style={[styles.columnHeader, { flex: 3 }]}>
          {type === "fuel" ? "Odo" : "Service"}
        </Text>
        <Text style={[styles.columnHeader, { flex: 2, textAlign: "right" }]}>
          Cost
        </Text>
      </View>
      {data.length > 0 ? (
        data.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={[styles.cell, { flex: 2 }]}>
              {new Date(item.isoDate).toLocaleDateString("en-GB")}
            </Text>
            <Text style={[styles.cell, { flex: 3 }]} numberOfLines={1}>
              {type === "fuel"
                ? `${item.odo} km`
                : item.serviceType || "Maintenance"}
            </Text>
            <Text
              style={[
                styles.cell,
                { flex: 2, textAlign: "right", fontWeight: "bold" },
              ]}
            >
              {item.cost.toLocaleString()}
            </Text>
          </View>
        ))
      ) : (
        <Text style={styles.noDataText}>No records found</Text>
      )}
    </View>
  );

  if (!activeVehicle) return null;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.header}>📊 Analysis: {activeVehicle.name}</Text>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={[styles.card, { backgroundColor: "#e8f6f3" }]}>
          <Text style={styles.cardLabel}>Avg Mileage</Text>
          <Text style={[styles.cardValue, { color: "#16a085" }]}>
            {avgMileage}
          </Text>
          <Text style={styles.cardUnit}>km/L</Text>
        </View>
        <View style={[styles.card, { backgroundColor: "#fff5f5" }]}>
          <Text style={styles.cardLabel}>Total Spent</Text>
          <Text style={[styles.cardValue, { color: "#c0392b" }]}>
            {(totalCost / 1000).toFixed(1)}k
          </Text>
          <Text style={styles.cardUnit}>Rs.</Text>
        </View>
        <View style={[styles.card, { backgroundColor: "#ebf5fb" }]}>
          <Text style={styles.cardLabel}>Distance</Text>
          <Text style={[styles.cardValue, { color: "#2980b9" }]}>
            {totalDistance}
          </Text>
          <Text style={styles.cardUnit}>km</Text>
        </View>
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Fuel Efficiency Trend (km/L)</Text>
        {chartData.length > 1 ? (
          <View style={{ marginLeft: -10, overflow: "hidden" }}>
            <LineChart
              data={chartData}
              height={180}
              width={Dimensions.get("window").width - 50}
              initialSpacing={20}
              spacing={50}
              color="#2980b9"
              thickness={3}
              dataPointsColor="#2980b9"
              areaChart
              yAxisTextStyle={{ color: "#7f8c8d", fontSize: 10 }}
              xAxisLabelTextStyle={{ color: "#7f8c8d", fontSize: 10 }}
              curved
            />
          </View>
        ) : (
          <Text style={styles.noDataText}>
            Add at least 2 fuel logs to see efficiency graph.
          </Text>
        )}
      </View>

      {/* Tables Section */}
      <LogTable title="Recent Fuel Logs" data={recentFuel} type="fuel" />
      <LogTable title="Recent Services" data={recentMaint} type="maint" />

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f4f4", padding: 15 },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  card: {
    flex: 1,
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
    marginHorizontal: 3,
    elevation: 2,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#7f8c8d",
    textTransform: "uppercase",
  },
  cardValue: { fontSize: 20, fontWeight: "bold", marginVertical: 5 },
  cardUnit: { fontSize: 12, color: "#7f8c8d" },
  chartContainer: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    elevation: 2,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
    marginBottom: 15,
  },
  noDataText: {
    textAlign: "center",
    color: "#999",
    marginVertical: 20,
    fontStyle: "italic",
  },

  // New Table Styles
  tableContainer: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    elevation: 2,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 10,
    marginBottom: 10,
  },
  columnHeader: { fontSize: 12, fontWeight: "bold", color: "#7f8c8d" },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f9f9f9",
  },
  cell: { fontSize: 13, color: "#333" },
});
