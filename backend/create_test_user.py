#!/usr/bin/env python3
"""Создание тестового пользователя"""
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime
import asyncio

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_test_user():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["iqair"]
    
    # Проверяем, существует ли пользователь
    existing = await db.users.find_one({"email": "test@example.com"})
    if existing:
        print("✓ Пользователь уже существует: test@example.com")
        print("   Пароль: test123")
        return
    
    # Создаем нового пользователя
    hashed_password = pwd_context.hash("test123")
    user_dict = {
        "email": "test@example.com",
        "name": "Test User",
        "hashed_password": hashed_password,
        "created_at": datetime.utcnow(),
        "role": "user",
        "sensor_permissions": []
    }
    
    result = await db.users.insert_one(user_dict)
    print("✓ Тестовый пользователь создан!")
    print("   Email: test@example.com")
    print("   Пароль: test123")
    print("   ID:", str(result.inserted_id))
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_test_user())
