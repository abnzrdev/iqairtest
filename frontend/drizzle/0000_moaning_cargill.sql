CREATE TABLE "devices" (
	"id" serial PRIMARY KEY NOT NULL,
	"serial" text NOT NULL,
	"type" text NOT NULL,
	CONSTRAINT "devices_serial_unique" UNIQUE("serial")
);
--> statement-breakpoint
CREATE TABLE "iot_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"data_payload" jsonb NOT NULL,
	"user_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sensor_health" (
	"health_id" serial PRIMARY KEY NOT NULL,
	"sensor_id" integer NOT NULL,
	"check_timestamp" timestamp DEFAULT now() NOT NULL,
	"uptime_seconds" integer,
	"reading_count_24h" integer,
	"battery_voltage" double precision,
	"memory_usage" integer,
	"last_reboot" timestamp,
	"health_status" text DEFAULT 'unknown' NOT NULL,
	"metadata_json" jsonb
);
--> statement-breakpoint
CREATE TABLE "sensor_readings" (
	"reading_id" serial PRIMARY KEY NOT NULL,
	"sensor_id" integer NOT NULL,
	"timestamp" timestamp NOT NULL,
	"server_received_at" timestamp DEFAULT now() NOT NULL,
	"pm1" double precision,
	"pm25" double precision,
	"pm10" double precision,
	"co2" double precision,
	"co" double precision,
	"o3" double precision,
	"no2" double precision,
	"voc" double precision,
	"ch2o" double precision,
	"temperature" double precision,
	"humidity" double precision,
	"pressure" double precision,
	"battery_level" integer,
	"signal_strength" integer,
	"error_code" text,
	"data_quality_score" double precision,
	"value" double precision,
	"location" text,
	"transport_type" text,
	"user_id" integer,
	"ingested_at" timestamp DEFAULT now() NOT NULL,
	"data_hash" text
);
--> statement-breakpoint
CREATE TABLE "sensors" (
	"sensor_id" serial PRIMARY KEY NOT NULL,
	"device_id" text NOT NULL,
	"site_id" integer,
	"sensor_type" text NOT NULL,
	"hardware_version" text,
	"firmware_version" text,
	"installation_date" timestamp,
	"last_calibration_date" timestamp,
	"latitude" double precision,
	"longitude" double precision,
	"altitude" double precision,
	"environment_type" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata_json" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sensors_device_id_unique" UNIQUE("device_id")
);
--> statement-breakpoint
CREATE TABLE "sites" (
	"site_id" serial PRIMARY KEY NOT NULL,
	"site_name" text NOT NULL,
	"city" text,
	"country" text DEFAULT 'KZ',
	"transit_type" text,
	"site_description" text,
	"contact_person" text,
	"contact_email" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_id" text,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password" text,
	"is_admin" text DEFAULT 'false' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "iot_data" ADD CONSTRAINT "iot_data_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sensor_health" ADD CONSTRAINT "sensor_health_sensor_id_sensors_sensor_id_fk" FOREIGN KEY ("sensor_id") REFERENCES "public"."sensors"("sensor_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sensor_readings" ADD CONSTRAINT "sensor_readings_sensor_id_sensors_sensor_id_fk" FOREIGN KEY ("sensor_id") REFERENCES "public"."sensors"("sensor_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sensor_readings" ADD CONSTRAINT "sensor_readings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sensors" ADD CONSTRAINT "sensors_site_id_sites_site_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("site_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sensor_health_sensor_id_idx" ON "sensor_health" USING btree ("sensor_id");--> statement-breakpoint
CREATE INDEX "sensor_health_check_timestamp_idx" ON "sensor_health" USING btree ("check_timestamp");--> statement-breakpoint
CREATE INDEX "sensor_health_health_status_idx" ON "sensor_health" USING btree ("health_status");--> statement-breakpoint
CREATE INDEX "sensor_readings_timestamp_idx" ON "sensor_readings" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "sensor_readings_sensor_timestamp_idx" ON "sensor_readings" USING btree ("sensor_id","timestamp");--> statement-breakpoint
CREATE INDEX "sensor_readings_sensor_id_idx" ON "sensor_readings" USING btree ("sensor_id");--> statement-breakpoint
CREATE INDEX "sensor_readings_data_hash_idx" ON "sensor_readings" USING btree ("data_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "sensors_device_id_idx" ON "sensors" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "sensors_site_id_idx" ON "sensors" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "sensors_is_active_idx" ON "sensors" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "sites_site_name_idx" ON "sites" USING btree ("site_name");