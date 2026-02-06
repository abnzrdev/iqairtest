import crypto from "crypto";

export interface SensorReadingPayload {
  device_id: string;
  site?: string;
  timestamp: string;
  readings: {
    pm1?: number;
    pm25?: number;
    pm10?: number;
    co2?: number;
    co?: number;
    o3?: number;
    no2?: number;
    voc?: number;
    ch2o?: number;
    temp?: number;
    hum?: number;
    pressure?: number;
  };
  metadata?: {
    battery?: number;
    signal?: number;
    firmware?: string;
    error_code?: string;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

const VALUE_RANGES = {
  pm1: { min: 0, max: 1000 },
  pm25: { min: 0, max: 1000 },
  pm10: { min: 0, max: 1000 },
  co2: { min: 300, max: 5000 },
  co: { min: 0, max: 100 },
  o3: { min: 0, max: 500 },
  no2: { min: 0, max: 500 },
  voc: { min: 0, max: 100 },
  ch2o: { min: 0, max: 10 },
  temp: { min: -40, max: 60 },
  hum: { min: 0, max: 100 },
  pressure: { min: 800, max: 1200 },
  battery: { min: 0, max: 100 },
  signal: { min: -120, max: 0 },
};

export function validateTimestamp(timestamp: string): { isValid: boolean; error?: string } {
  try {
    const date = new Date(timestamp);

    if (isNaN(date.getTime())) {
      return { isValid: false, error: "Invalid timestamp format" };
    }

    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    if (date < fiveMinutesAgo) {
      return { isValid: false, error: "Timestamp is too old (more than 5 minutes ago)" };
    }

    if (date > oneHourFromNow) {
      return { isValid: false, error: "Timestamp is in the future (more than 1 hour ahead)" };
    }

    return { isValid: true };
  } catch {
    return { isValid: false, error: "Failed to parse timestamp" };
  }
}

function validateRange(
  value: number | undefined,
  fieldName: string,
  range: { min: number; max: number }
): { isValid: boolean; error?: string; warning?: string } {
  if (value === undefined || value === null) {
    return { isValid: true };
  }

  if (typeof value !== "number" || isNaN(value) || !isFinite(value)) {
    return { isValid: false, error: `${fieldName} must be a valid number` };
  }

  if (value < range.min) {
    return { isValid: false, error: `${fieldName} (${value}) is below minimum (${range.min})` };
  }

  if (value > range.max) {
    return { isValid: false, error: `${fieldName} (${value}) exceeds maximum (${range.max})` };
  }

  if (value >= range.max * 0.9) {
    return { isValid: true, warning: `${fieldName} is near maximum range (${value} of ${range.max})` };
  }

  return { isValid: true };
}

export function validateSensorReading(payload: SensorReadingPayload): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!payload.device_id || typeof payload.device_id !== "string" || payload.device_id.trim() === "") {
    errors.push("device_id is required and must be a non-empty string");
  }

  if (!payload.timestamp || typeof payload.timestamp !== "string") {
    errors.push("timestamp is required and must be a string");
  } else {
    const timestampValidation = validateTimestamp(payload.timestamp);
    if (!timestampValidation.isValid) {
      errors.push(`timestamp: ${timestampValidation.error}`);
    }
  }

  if (!payload.readings || typeof payload.readings !== "object") {
    errors.push("readings object is required");
  } else {
    if (payload.readings.pm1 !== undefined) {
      const result = validateRange(payload.readings.pm1, "pm1", VALUE_RANGES.pm1);
      if (!result.isValid) errors.push(result.error!);
      if (result.warning) warnings.push(result.warning);
    }

    if (payload.readings.pm25 !== undefined) {
      const result = validateRange(payload.readings.pm25, "pm25", VALUE_RANGES.pm25);
      if (!result.isValid) errors.push(result.error!);
      if (result.warning) warnings.push(result.warning);
    }

    if (payload.readings.pm10 !== undefined) {
      const result = validateRange(payload.readings.pm10, "pm10", VALUE_RANGES.pm10);
      if (!result.isValid) errors.push(result.error!);
      if (result.warning) warnings.push(result.warning);
    }

    if (payload.readings.co2 !== undefined) {
      const result = validateRange(payload.readings.co2, "co2", VALUE_RANGES.co2);
      if (!result.isValid) errors.push(result.error!);
      if (result.warning) warnings.push(result.warning);
    }

    if (payload.readings.co !== undefined) {
      const result = validateRange(payload.readings.co, "co", VALUE_RANGES.co);
      if (!result.isValid) errors.push(result.error!);
      if (result.warning) warnings.push(result.warning);
    }

    if (payload.readings.o3 !== undefined) {
      const result = validateRange(payload.readings.o3, "o3", VALUE_RANGES.o3);
      if (!result.isValid) errors.push(result.error!);
      if (result.warning) warnings.push(result.warning);
    }

    if (payload.readings.no2 !== undefined) {
      const result = validateRange(payload.readings.no2, "no2", VALUE_RANGES.no2);
      if (!result.isValid) errors.push(result.error!);
      if (result.warning) warnings.push(result.warning);
    }

    if (payload.readings.voc !== undefined) {
      const result = validateRange(payload.readings.voc, "voc", VALUE_RANGES.voc);
      if (!result.isValid) errors.push(result.error!);
      if (result.warning) warnings.push(result.warning);
    }

    if (payload.readings.ch2o !== undefined) {
      const result = validateRange(payload.readings.ch2o, "ch2o", VALUE_RANGES.ch2o);
      if (!result.isValid) errors.push(result.error!);
      if (result.warning) warnings.push(result.warning);
    }

    if (payload.readings.temp !== undefined) {
      const result = validateRange(payload.readings.temp, "temp", VALUE_RANGES.temp);
      if (!result.isValid) errors.push(result.error!);
      if (result.warning) warnings.push(result.warning);
    }

    if (payload.readings.hum !== undefined) {
      const result = validateRange(payload.readings.hum, "hum", VALUE_RANGES.hum);
      if (!result.isValid) errors.push(result.error!);
      if (result.warning) warnings.push(result.warning);
    }

    if (payload.readings.pressure !== undefined) {
      const result = validateRange(payload.readings.pressure, "pressure", VALUE_RANGES.pressure);
      if (!result.isValid) errors.push(result.error!);
      if (result.warning) warnings.push(result.warning);
    }
  }

  if (payload.metadata) {
    if (payload.metadata.battery !== undefined) {
      const result = validateRange(payload.metadata.battery, "battery", VALUE_RANGES.battery);
      if (!result.isValid) errors.push(result.error!);
      if (result.warning) warnings.push(result.warning);
    }

    if (payload.metadata.signal !== undefined) {
      const result = validateRange(payload.metadata.signal, "signal", VALUE_RANGES.signal);
      if (!result.isValid) errors.push(result.error!);
      if (result.warning) warnings.push(result.warning);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function generateDataHash(payload: SensorReadingPayload): string {
  const hashInput = JSON.stringify({
    device_id: payload.device_id,
    timestamp: payload.timestamp,
    pm25: payload.readings?.pm25,
    co2: payload.readings?.co2,
    temp: payload.readings?.temp,
  });

  return crypto.createHash("sha256").update(hashInput).digest("hex");
}
