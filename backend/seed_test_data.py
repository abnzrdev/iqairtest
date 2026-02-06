#!/usr/bin/env python3
"""Seed test data for test@example.com with sensors at various locations showing air quality changes."""
import asyncio
from datetime import datetime
from sqlalchemy import select
from main import AsyncSessionLocal, Base, User, Sensor, engine, user_sensor_permissions

async def seed_test_data():
    """Create test sensors with parameters for the test user."""

    # Create tables if they don't exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # Find the test user
        result = await session.execute(select(User).where(User.email == "test@example.com"))
        user = result.scalar_one_or_none()

        if not user:
            print("❌ Test user not found. Run create_test_user.py first.")
            return

        print(f"✓ Found test user: {user.email}")

        # Define test sensors at different locations in Almaty
        test_sensors = [
            {
                "name": "Downtown Center",
                "description": "Sensor in downtown business district",
                "city": "Almaty",
                "country": "Kazakhstan",
                "location": {"type": "Point", "coordinates": [76.9385, 43.2380]},  # [lon, lat]
                "parameters": {
                    "pm25": 45.5,      # Moderate air quality
                    "pm10": 65.2,
                    "co2": 420,
                    "co": 0.8,
                    "o3": 35,
                    "no2": 42,
                    "voc": 0.5,
                    "ch2o": 0.02,
                    "temp": 22,
                    "hum": 45,
                },
                "price": 0,
            },
            {
                "name": "Park Monitor",
                "description": "Sensor near Gorky Park",
                "city": "Almaty",
                "country": "Kazakhstan",
                "location": {"type": "Point", "coordinates": [76.8800, 43.2150]},
                "parameters": {
                    "pm25": 28.3,      # Good air quality
                    "pm10": 35.5,
                    "co2": 410,
                    "co": 0.3,
                    "o3": 28,
                    "no2": 25,
                    "voc": 0.2,
                    "ch2o": 0.01,
                    "temp": 20,
                    "hum": 55,
                },
                "price": 0,
            },
            {
                "name": "Industrial Zone",
                "description": "Sensor in industrial area",
                "city": "Almaty",
                "country": "Kazakhstan",
                "location": {"type": "Point", "coordinates": [77.0500, 43.1800]},
                "parameters": {
                    "pm25": 95.7,      # Unhealthy air quality
                    "pm10": 145.2,
                    "co2": 480,
                    "co": 2.5,
                    "o3": 55,
                    "no2": 78,
                    "voc": 1.2,
                    "ch2o": 0.08,
                    "temp": 24,
                    "hum": 35,
                },
                "price": 0,
            },
            {
                "name": "Highway Monitor",
                "description": "Sensor near main highway",
                "city": "Almaty",
                "country": "Kazakhstan",
                "location": {"type": "Point", "coordinates": [77.1200, 43.2500]},
                "parameters": {
                    "pm25": 65.4,      # Moderate to unhealthy
                    "pm10": 95.8,
                    "co2": 450,
                    "co": 1.5,
                    "o3": 45,
                    "no2": 58,
                    "voc": 0.8,
                    "ch2o": 0.04,
                    "temp": 21,
                    "hum": 50,
                },
                "price": 0,
            },
            {
                "name": "Residential Area",
                "description": "Sensor in residential neighborhood",
                "city": "Almaty",
                "country": "Kazakhstan",
                "location": {"type": "Point", "coordinates": [76.7800, 43.2800]},
                "parameters": {
                    "pm25": 38.2,      # Good to moderate
                    "pm10": 52.1,
                    "co2": 415,
                    "co": 0.5,
                    "o3": 32,
                    "no2": 35,
                    "voc": 0.3,
                    "ch2o": 0.015,
                    "temp": 19,
                    "hum": 60,
                },
                "price": 0,
            },
        ]

        created_count = 0
        existing_count = 0

        for sensor_data in test_sensors:
            # Check if sensor already exists
            result = await session.execute(
                select(Sensor).where(Sensor.name == sensor_data["name"])
            )
            existing_sensor = result.scalar_one_or_none()

            if existing_sensor:
                print(f"  ⊝ {sensor_data['name']} already exists")
                existing_count += 1
                # Make sure user has access to this sensor
                if existing_sensor not in user.sensors:
                    user.sensors.append(existing_sensor)
                    await session.commit()
                    print(f"    ✓ Granted access to {sensor_data['name']}")
            else:
                # Create new sensor
                new_sensor = Sensor(
                    name=sensor_data["name"],
                    description=sensor_data["description"],
                    city=sensor_data["city"],
                    country=sensor_data["country"],
                    location=sensor_data["location"],
                    parameters=sensor_data["parameters"],
                    price=sensor_data["price"],
                    created_at=datetime.utcnow(),
                )
                session.add(new_sensor)
                await session.flush()  # Generate ID

                # Add sensor to user's sensors
                user.sensors.append(new_sensor)
                await session.commit()

                print(f"  ✓ Created sensor: {sensor_data['name']}")
                print(f"    Location: {sensor_data['location']['coordinates']}")
                print(f"    PM2.5: {sensor_data['parameters']['pm25']}")
                created_count += 1

        print(f"\n✓ Seeding complete!")
        print(f"  - Created: {created_count} new sensors")
        print(f"  - Already existed: {existing_count} sensors")
        print(f"  - Total available to test@example.com: {len(user.sensors)} sensors")
        print("\nThese sensors will now display on the map with different air quality levels.")
        print("You can modify parameters by sending PUT requests to update sensor data.")


if __name__ == "__main__":
    asyncio.run(seed_test_data())
