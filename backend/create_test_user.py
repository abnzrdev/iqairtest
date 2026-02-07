#!/usr/bin/env python3
"""Создание тестового пользователя"""
import os
import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

def get_password_hash(password: str) -> str:
    import bcrypt
    if isinstance(password, str):
        password = password.encode("utf-8")
    if len(password) > 72:
        password = password[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password, salt).decode("utf-8")

async def create_test_user():
    mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    db_name = os.getenv("DATABASE_NAME", "breez")
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Проверяем, существует ли пользователь
    existing = await db.users.find_one({"email": "test@example.com"})
    if existing:
        print("✓ Пользователь уже существует: test@example.com")
        print("   Пароль: test123")
        return
    
    # Создаем нового пользователя
    hashed_password = get_password_hash("test123")
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
