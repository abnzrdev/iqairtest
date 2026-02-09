import { NextResponse } from 'next/server';
import postgres from 'postgres';

// Подключение к базе данных data-tynys-postgres-1
const getDbConnection = () => {
  // По умолчанию используем localhost, так как приложение работает на хосте
  const dbHost = process.env.TYNYS_DB_HOST || 'localhost';
  const dbPort = process.env.TYNYS_DB_PORT || '5435';
  const dbUser = process.env.TYNYS_DB_USER || 'aq';
  const dbPassword = process.env.TYNYS_DB_PASSWORD || 'very_strong_password';
  const dbName = process.env.TYNYS_DB_NAME || 'aqdb';
  
  const dbUrl = process.env.TYNYS_DB_URL || 
    `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
  
  return postgres(dbUrl, { max: 1 });
};

export async function GET() {
  try {
    const sql = getDbConnection();
    
    // Получаем только последнюю запись от активного устройства (lab01)
    // Только данные, которые поступают сейчас
    const readings = await sql`
      SELECT 
        r.id,
        r.device_id,
        r.ts,
        r.data,
        d.id as device_id_full
      FROM readings r
      LEFT JOIN devices d ON r.device_id = d.id
      WHERE r.device_id = 'lab01'
        AND r.ts > NOW() - INTERVAL '10 minutes'
      ORDER BY r.ts DESC
      LIMIT 1
    `;

    // Маппинг сайтов на координаты
    const siteCoordinates: Record<string, string> = {
      'AGI_Lab': '43.2220,76.8512', // Алматы, центр города
      'Almaty': '43.2220,76.8512',
      'Алматы': '43.2220,76.8512',
    };

    // Тип для результата SQL запроса
    type ReadingRow = {
      id: number;
      device_id: string;
      ts: Date;
      data: Record<string, unknown>;
      device_id_full?: string | null;
    };

    // Преобразуем данные в формат MapReading
    const mapReadings = (readings as unknown as ReadingRow[]).map((reading) => {
      const data = reading.data || {};
      const site = typeof data.site === 'string' ? data.site : '';
      
      // Определяем координаты по сайту или используем дефолтные
      const location = siteCoordinates[site] || '43.2220,76.8512';
      
      // Извлекаем все параметры сенсора
      const num = (v: unknown) => (typeof v === 'number' ? v : 0);
      const pm25 = num(data.pm25) || num(data.pm2_5);
      
      return {
        location,
        value: pm25,
        timestamp: reading.ts.toISOString(),
        sensorId: reading.device_id || 'unknown',
        site: site || undefined,
        parameters: {
          pm1: num(data.pm1),
          pm25,
          pm10: num(data.pm10),
          co2: num(data.co2),
          voc: num(data.voc),
          temp: num(data.temp),
          hum: num(data.hum),
          ch2o: num(data.ch2o),
          co: num(data.co),
          o3: num(data.o3),
          no2: num(data.no2),
        },
      };
    });

    await sql.end();

    return NextResponse.json({
      success: true,
      data: mapReadings,
      count: mapReadings.length,
    });
  } catch (error) {
    console.error('Error fetching map data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch map data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
