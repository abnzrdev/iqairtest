import { desc, eq } from "drizzle-orm";
import { getDb } from "./db";
import { sensorReadings, sensors } from "./db/schema";
import type { MapReading } from "@/types/map-reading";

export async function getRecentSensorReadings(limit: number = 500): Promise<MapReading[]> {
  try {
    const db = getDb();
    const readings = await db
      .select({
        id: sensorReadings.id,
        sensorId: sensorReadings.sensorId,
        deviceId: sensors.deviceId,
        timestamp: sensorReadings.timestamp,
        value: sensorReadings.value,
        pm25: sensorReadings.pm25,
        pm10: sensorReadings.pm10,
        pm1: sensorReadings.pm1,
        co2: sensorReadings.co2,
        location: sensorReadings.location,
        latitude: sensors.latitude,
        longitude: sensors.longitude,
      })
      .from(sensorReadings)
      .leftJoin(sensors, eq(sensorReadings.sensorId, sensors.id))
      .orderBy(desc(sensorReadings.ingestedAt))
      .limit(limit);

    return readings.map((reading) => {
      const location =
        reading.latitude != null && reading.longitude != null
          ? `${reading.latitude},${reading.longitude}`
          : reading.location ?? null;

      const timestamp =
        reading.timestamp instanceof Date
          ? reading.timestamp.toISOString()
          : new Date(reading.timestamp).toISOString();

      const value =
        reading.value ??
        reading.pm25 ??
        reading.pm10 ??
        reading.pm1 ??
        reading.co2 ??
        0;

      return {
        location,
        value,
        timestamp,
        sensorId: reading.deviceId ?? reading.sensorId?.toString() ?? "",
      };
    });
  } catch (error) {
    console.error("Error fetching sensor readings:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to fetch sensor readings: ${message}`);
  }
}
