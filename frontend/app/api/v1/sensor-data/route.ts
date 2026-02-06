import { NextRequest, NextResponse } from "next/server";
import {
  validateSensorReading,
  generateDataHash,
  type SensorReadingPayload,
} from "@/lib/sensor-validation";
import {
  insertSensorReading,
  findOrCreateSensor,
  findOrCreateSite,
  checkDuplicateReading,
} from "@/lib/sensor-data-access";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const iotDeviceSecret = process.env.IOT_DEVICE_SECRET;

    if (!iotDeviceSecret) {
      console.error("IOT_DEVICE_SECRET is not configured");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    if (!authHeader) {
      return NextResponse.json(
        { error: "Unauthorized - Missing Authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;

    if (token !== iotDeviceSecret) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid credentials" },
        { status: 401 }
      );
    }

    let payload: SensorReadingPayload;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    const validation = validateSensorReading(payload);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: "Validation failed",
          errors: validation.errors,
          warnings: validation.warnings.length > 0 ? validation.warnings : undefined,
        },
        { status: 400 }
      );
    }

    const dataHash = generateDataHash(payload);
    const isDuplicate = await checkDuplicateReading(dataHash);
    if (isDuplicate) {
      return NextResponse.json(
        {
          success: true,
          message: "Duplicate reading detected and skipped",
          duplicate: true,
        },
        { status: 200 }
      );
    }

    let siteId: number | null = null;
    if (payload.site) {
      siteId = await findOrCreateSite(payload.site);
    }

    const sensor = await findOrCreateSensor({
      deviceId: payload.device_id,
      siteId,
      firmwareVersion: payload.metadata?.firmware,
    });

    const readingId = await insertSensorReading({
      sensorId: sensor.id,
      timestamp: payload.timestamp,
      readings: payload.readings,
      metadata: payload.metadata,
      dataHash,
    });

    if (payload.metadata?.battery !== undefined || payload.metadata?.signal !== undefined) {
      console.log("Sensor health data received:", {
        sensorId: sensor.id,
        battery: payload.metadata.battery,
        signal: payload.metadata.signal,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Sensor data ingested successfully",
        data: {
          readingId,
          sensorId: sensor.id,
          deviceId: payload.device_id,
          timestamp: payload.timestamp,
        },
        warnings: validation.warnings.length > 0 ? validation.warnings : undefined,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error processing sensor data request:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
