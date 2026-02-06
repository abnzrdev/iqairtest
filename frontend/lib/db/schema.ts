import {
  pgTable,
  serial,
  text,
  timestamp,
  jsonb,
  integer,
  doublePrecision,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================
// USER MANAGEMENT
// ============================================

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: text("clerk_id").unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password"),
  isAdmin: text("is_admin").default("false").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const devices = pgTable("devices", {
  id: serial("id").primaryKey(),
  serial: text("serial").notNull().unique(),
  type: text("type").notNull(),
});

export const iotData = pgTable("iot_data", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  dataPayload: jsonb("data_payload").notNull(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
});

// ============================================
// SENSOR DATABASE SCHEMA
// ============================================

export const sites = pgTable(
  "sites",
  {
    id: serial("site_id").primaryKey(),
    siteName: text("site_name").notNull(),
    city: text("city"),
    country: text("country").default("KZ"),
    transitType: text("transit_type"),
    siteDescription: text("site_description"),
    contactPerson: text("contact_person"),
    contactEmail: text("contact_email"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    siteNameIdx: index("sites_site_name_idx").on(table.siteName),
  })
);

export const sensors = pgTable(
  "sensors",
  {
    id: serial("sensor_id").primaryKey(),
    deviceId: text("device_id").notNull().unique(),
    siteId: integer("site_id").references(() => sites.id),
    sensorType: text("sensor_type").notNull(),
    hardwareVersion: text("hardware_version"),
    firmwareVersion: text("firmware_version"),
    installationDate: timestamp("installation_date"),
    lastCalibrationDate: timestamp("last_calibration_date"),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    altitude: doublePrecision("altitude"),
    environmentType: text("environment_type"),
    isActive: boolean("is_active").default(true).notNull(),
    metadataJson: jsonb("metadata_json"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    deviceIdIdx: uniqueIndex("sensors_device_id_idx").on(table.deviceId),
    siteIdIdx: index("sensors_site_id_idx").on(table.siteId),
    isActiveIdx: index("sensors_is_active_idx").on(table.isActive),
  })
);

export const sensorReadings = pgTable(
  "sensor_readings",
  {
    id: serial("reading_id").primaryKey(),
    sensorId: integer("sensor_id").notNull().references(() => sensors.id),
    timestamp: timestamp("timestamp", { mode: "date" }).notNull(),
    serverReceivedAt: timestamp("server_received_at").notNull().defaultNow(),
    pm1: doublePrecision("pm1"),
    pm25: doublePrecision("pm25"),
    pm10: doublePrecision("pm10"),
    co2: doublePrecision("co2"),
    co: doublePrecision("co"),
    o3: doublePrecision("o3"),
    no2: doublePrecision("no2"),
    voc: doublePrecision("voc"),
    ch2o: doublePrecision("ch2o"),
    temperature: doublePrecision("temperature"),
    humidity: doublePrecision("humidity"),
    pressure: doublePrecision("pressure"),
    batteryLevel: integer("battery_level"),
    signalStrength: integer("signal_strength"),
    errorCode: text("error_code"),
    dataQualityScore: doublePrecision("data_quality_score"),
    value: doublePrecision("value"),
    location: text("location"),
    transportType: text("transport_type"),
    userId: integer("user_id").references(() => users.id),
    ingestedAt: timestamp("ingested_at").notNull().defaultNow(),
    dataHash: text("data_hash"),
  },
  (table) => ({
    timestampIdx: index("sensor_readings_timestamp_idx").on(table.timestamp),
    sensorTimestampIdx: index("sensor_readings_sensor_timestamp_idx").on(
      table.sensorId,
      table.timestamp
    ),
    sensorIdIdx: index("sensor_readings_sensor_id_idx").on(table.sensorId),
    dataHashIdx: index("sensor_readings_data_hash_idx").on(table.dataHash),
  })
);

export const sensorHealth = pgTable(
  "sensor_health",
  {
    id: serial("health_id").primaryKey(),
    sensorId: integer("sensor_id").notNull().references(() => sensors.id),
    checkTimestamp: timestamp("check_timestamp").notNull().defaultNow(),
    uptimeSeconds: integer("uptime_seconds"),
    readingCount24h: integer("reading_count_24h"),
    batteryVoltage: doublePrecision("battery_voltage"),
    memoryUsage: integer("memory_usage"),
    lastReboot: timestamp("last_reboot"),
    healthStatus: text("health_status").notNull().default("unknown"),
    metadataJson: jsonb("metadata_json"),
  },
  (table) => ({
    sensorIdIdx: index("sensor_health_sensor_id_idx").on(table.sensorId),
    checkTimestampIdx: index("sensor_health_check_timestamp_idx").on(
      table.checkTimestamp
    ),
    healthStatusIdx: index("sensor_health_health_status_idx").on(
      table.healthStatus
    ),
  })
);

// ============================================
// RELATIONS (Drizzle ORM)
// ============================================

export const sitesRelations = relations(sites, ({ many }) => ({
  sensors: many(sensors),
}));

export const sensorsRelations = relations(sensors, ({ one, many }) => ({
  site: one(sites, {
    fields: [sensors.siteId],
    references: [sites.id],
  }),
  readings: many(sensorReadings),
  healthRecords: many(sensorHealth),
}));

export const sensorReadingsRelations = relations(sensorReadings, ({ one }) => ({
  sensor: one(sensors, {
    fields: [sensorReadings.sensorId],
    references: [sensors.id],
  }),
}));

export const sensorHealthRelations = relations(sensorHealth, ({ one }) => ({
  sensor: one(sensors, {
    fields: [sensorHealth.sensorId],
    references: [sensors.id],
  }),
}));
