from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional, List
import httpx
import os
import json
import re
import asyncio
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="IQAir API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:3001", 
        "http://localhost:3003",
        "http://89.218.178.215:3003",
        "http://89.218.178.215:3000",
        "http://89.218.178.215:3001"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "iqair")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DATABASE_NAME]

# Security
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
# Using bcrypt directly instead of passlib to avoid compatibility issues
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Admin mock user
ADMIN_SECRET = os.getenv("ADMIN_SECRET", "admin-secret")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@local")
ADMIN_NAME = os.getenv("ADMIN_NAME", "Admin")

# IQAir API
IQAIR_API_KEY = os.getenv("IQAIR_API_KEY", "")
IQAIR_BASE_URL = "http://api.airvisual.com/v2"

# Air Quality Sensor API
SENSOR_API_URL = os.getenv("SENSOR_API_URL", "http://89.218.178.215:3003/")

# Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str = "user"
    sensor_permissions: Optional[List[str]] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class SensorData(BaseModel):
    device_id: str
    site: str
    pm1: float
    pm25: float
    pm10: float
    co2: float
    voc: float
    temp: float
    hum: float
    ch2o: float
    co: float
    o3: float
    no2: float

class AirQualityData(BaseModel):
    city: str
    state: str
    country: str
    location: dict
    current: dict
    historical: Optional[List[dict]] = None
    sensor_data: Optional[dict] = None

class AirQualityRequest(BaseModel):
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None

# Admin / sensors / purchases
class SensorBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float = 0
    location: Optional[dict] = None  # {"type": "Point", "coordinates": [lon, lat]}
    city: Optional[str] = None
    country: Optional[str] = None
    parameters: Optional[dict] = None  # e.g. {"pm25": 12, "pm10": 20}


class SensorResponse(SensorBase):
    id: str
    created_at: datetime


class GrantAccessRequest(BaseModel):
    email: EmailStr


class MakeAdminRequest(BaseModel):
    email: EmailStr

# Helper functions
def verify_password(plain_password, hashed_password):
    """Verify a password against a hash"""
    if isinstance(plain_password, str):
        plain_password = plain_password.encode('utf-8')
    if isinstance(hashed_password, str):
        hashed_password = hashed_password.encode('utf-8')
    return bcrypt.checkpw(plain_password, hashed_password)

def get_password_hash(password):
    """Hash a password using bcrypt"""
    if isinstance(password, str):
        password = password.encode('utf-8')
    # bcrypt has a 72 byte limit, truncate if necessary
    if len(password) > 72:
        password = password[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password, salt).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def sensor_to_response(sensor: dict) -> dict:
    return {
        "id": str(sensor.get("_id")),
        "name": sensor.get("name"),
        "description": sensor.get("description"),
        "price": sensor.get("price", 0),
        "location": sensor.get("location"),
        "city": sensor.get("city"),
        "country": sensor.get("country"),
        "parameters": sensor.get("parameters", {}),
        "created_at": sensor.get("created_at"),
    }

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role", "user")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Mock admin user (не хранится в БД)
    if email == ADMIN_EMAIL and role == "admin":
        return {
            "_id": "admin",
            "email": ADMIN_EMAIL,
            "name": ADMIN_NAME,
            "role": "admin",
            "sensor_permissions": []
        }
    
    user = await db.users.find_one({"email": email})
    if user is None:
        raise credentials_exception
    # гарантируем роль и права
    user["role"] = user.get("role", role or "user")
    user["sensor_permissions"] = user.get("sensor_permissions", [])
    return user


def user_is_admin(user: dict) -> bool:
    return user.get("role") == "admin"


def safe_get_user_id(current_user: dict):
    """
    Безопасно получает user_id из current_user, обрабатывая случай мок-админа.
    Возвращает tuple: (is_admin: bool, user_id: ObjectId | None)
    """
    user_id = current_user.get("_id")
    
    # Проверяем на мок-админа
    if user_id == "admin" or str(user_id).lower() == "admin":
        return (True, None)
    
    # Конвертируем в ObjectId если нужно
    if isinstance(user_id, ObjectId):
        return (False, user_id)
    elif isinstance(user_id, str) and ObjectId.is_valid(user_id):
        return (False, ObjectId(user_id))
    else:
        # Некорректный user_id
        print(f"⚠️ Invalid user_id in safe_get_user_id: {user_id}, type: {type(user_id)}")
        return (False, None)


async def require_admin(current_user: dict = Depends(get_current_user)):
    if not user_is_admin(current_user):
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# Routes
@app.get("/")
async def root():
    return {"message": "IQAir API", "version": "1.0.0"}

@app.post("/register", response_model=UserResponse)
async def register(user: UserCreate):
    try:
        # Check if user exists
        existing_user = await db.users.find_one({"email": user.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create user
        print(f"🔐 Hashing password for user: {user.email}")
        hashed_password = get_password_hash(user.password)
        print(f"✓ Password hashed successfully")
        user_dict = {
            "email": user.email,
            "name": user.name,
            "hashed_password": hashed_password,
            "created_at": datetime.utcnow(),
            "role": "user",
            "sensor_permissions": []
        }
        print(f"💾 Inserting user into database...")
        result = await db.users.insert_one(user_dict)
        print(f"✓ User created with ID: {result.inserted_id}")
        user_dict["id"] = str(result.inserted_id)
        return UserResponse(
            id=user_dict["id"],
            email=user_dict["email"],
            name=user_dict["name"],
            role=user_dict["role"],
            sensor_permissions=user_dict["sensor_permissions"]
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Registration error: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500, 
            detail=f"Registration failed: {str(e)}"
        )

@app.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await db.users.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    user_role = user.get("role", "user")
    access_token = create_access_token(
        data={"sub": user["email"], "role": user_role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/me", response_model=UserResponse)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user["_id"]),
        email=current_user["email"],
        name=current_user["name"],
        role=current_user.get("role", "user"),
        sensor_permissions=current_user.get("sensor_permissions", [])
    )


class AdminLoginRequest(BaseModel):
    secret: str


@app.post("/admin/login", response_model=Token)
async def admin_login(body: AdminLoginRequest):
    if body.secret != ADMIN_SECRET:
        raise HTTPException(status_code=401, detail="Invalid admin secret")
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": ADMIN_EMAIL, "role": "admin"}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

def calculate_aqi(pm25: float) -> int:
    """Вычисляет AQI на основе PM2.5 по стандарту US EPA"""
    if pm25 <= 12.0:
        return int((50 / 12.0) * pm25)
    elif pm25 <= 35.4:
        return int(50 + ((100 - 50) / (35.4 - 12.0)) * (pm25 - 12.0))
    elif pm25 <= 55.4:
        return int(100 + ((150 - 100) / (55.4 - 35.4)) * (pm25 - 35.4))
    elif pm25 <= 150.4:
        return int(150 + ((200 - 150) / (150.4 - 55.4)) * (pm25 - 55.4))
    elif pm25 <= 250.4:
        return int(200 + ((300 - 200) / (250.4 - 150.4)) * (pm25 - 150.4))
    else:
        return int(300 + ((400 - 300) / (350.4 - 250.4)) * (pm25 - 250.4))

@app.get("/air-quality", response_model=AirQualityData)
async def get_air_quality(
    city: Optional[str] = None,
    state: Optional[str] = None,
    country: Optional[str] = None,
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    current_user: dict = Depends(get_current_user)
):
    try:
        # Используем тестовые данные (API отключено)
        sensor_data = None
        
        # Если есть данные с сенсора, используем их (но сейчас отключено)
        if False and sensor_data:
            try:
                pm25 = float(sensor_data.get("pm25", 0) or 0)
                if pm25 <= 0:
                    pm25 = 25.7  # Default fallback
                aqius = calculate_aqi(pm25)
            except (ValueError, TypeError) as e:
                print(f"Error processing sensor data: {e}")
                sensor_data = None
            
            if sensor_data:
                return {
                    "city": city or "Almaty",
                    "state": state or "Almaty",
                    "country": country or "Kazakhstan",
                    "location": {
                        "type": "Point",
                        "coordinates": [float(lon or 76.8512), float(lat or 43.2220)]
                    },
                    "current": {
                        "pollution": {
                            "ts": datetime.utcnow().isoformat(),
                            "aqius": aqius,
                            "mainus": "pm25",
                            "aqicn": aqius,
                            "maincn": "pm25",
                            "pm1": float(sensor_data.get("pm1", 0) or 0),
                            "pm25": float(sensor_data.get("pm25", 0) or 0),
                            "pm10": float(sensor_data.get("pm10", 0) or 0),
                            "co2": float(sensor_data.get("co2", 0) or 0),
                            "voc": float(sensor_data.get("voc", 0) or 0),
                            "ch2o": float(sensor_data.get("ch2o", 0) or 0),
                            "co": float(sensor_data.get("co", 0) or 0),
                            "o3": float(sensor_data.get("o3", 0) or 0),
                            "no2": float(sensor_data.get("no2", 0) or 0),
                        },
                        "weather": {
                            "ts": datetime.utcnow().isoformat(),
                            "tp": float(sensor_data.get("temp", 0) or 0),
                            "pr": 1013,
                            "hu": float(sensor_data.get("hum", 0) or 0),
                            "ws": 0,
                            "wd": 0,
                            "ic": "01d"
                        }
                    },
                    "sensor_data": {
                        "device_id": sensor_data.get("device_id", ""),
                        "site": sensor_data.get("site", ""),
                    }
                }
        
        # Fallback на mock данные
        return {
            "city": city or "Almaty",
            "state": state or "Almaty",
            "country": country or "Kazakhstan",
            "location": {
                "type": "Point",
                "coordinates": [float(lon or 76.8512), float(lat or 43.2220)]
            },
            "current": {
                "pollution": {
                    "ts": datetime.utcnow().isoformat(),
                    "aqius": 45,
                    "mainus": "p2",
                    "aqicn": 30,
                    "maincn": "p2"
                },
                "weather": {
                    "ts": datetime.utcnow().isoformat(),
                    "tp": 15,
                    "pr": 1013,
                    "hu": 65,
                    "ws": 5.2,
                    "wd": 180,
                    "ic": "01d"
                }
            }
        }
    except Exception as e:
        print(f"Error in get_air_quality: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/air-quality/history")
async def get_air_quality_history(
    city: str,
    state: str,
    country: str,
    current_user: dict = Depends(get_current_user)
):
    # Get historical data from MongoDB or IQAir API
    history = await db.air_quality_history.find({
        "city": city,
        "state": state,
        "country": country
    }).sort("timestamp", -1).limit(30).to_list(30)
    
    return {"history": history}

@app.get("/air-quality/all")
async def get_all_air_quality_data(current_user: dict = Depends(get_current_user)):
    """Получить данные со всех доступных сенсоров"""
    try:
        # API и WebSocket полностью отключены - используем только тестовые данные
        sensor_data = []
        print("⚠️ API и WebSocket отключены, используем только тестовые данные")
        
        # Обрабатываем данные со всех сенсоров (только тестовые)
        all_data = []
        print(f"DEBUG: Processing {len(sensor_data)} sensors")
        if sensor_data and len(sensor_data) > 0:
            for idx, sensor in enumerate(sensor_data):
                print(f"DEBUG: Processing sensor {idx + 1}/{len(sensor_data)}: {sensor.get('device_id', 'unknown')}")
                try:
                    pm25 = float(sensor.get("pm25", 0) or 0)
                    if pm25 <= 0:
                        pm25 = 25.7
                    aqius = calculate_aqi(pm25)
                    
                    # Получаем координаты из данных API
                    device_id = sensor.get("device_id", "unknown")
                    site = sensor.get("site", "unknown")
                    
                    # Пробуем получить координаты из разных полей API
                    lat = None
                    lon = None
                    
                    # Проверяем различные варианты названий полей для координат
                    if "lat" in sensor:
                        lat = float(sensor.get("lat", 0) or 0)
                    elif "latitude" in sensor:
                        lat = float(sensor.get("latitude", 0) or 0)
                    elif "y" in sensor:
                        lat = float(sensor.get("y", 0) or 0)
                    
                    if "lon" in sensor:
                        lon = float(sensor.get("lon", 0) or 0)
                    elif "lng" in sensor:
                        lon = float(sensor.get("lng", 0) or 0)
                    elif "longitude" in sensor:
                        lon = float(sensor.get("longitude", 0) or 0)
                    elif "x" in sensor:
                        lon = float(sensor.get("x", 0) or 0)
                    
                    # Проверяем вложенные объекты location
                    if "location" in sensor:
                        loc = sensor["location"]
                        if isinstance(loc, dict):
                            if "lat" in loc:
                                lat = float(loc.get("lat", 0) or 0)
                            elif "latitude" in loc:
                                lat = float(loc.get("latitude", 0) or 0)
                            
                            if "lon" in loc:
                                lon = float(loc.get("lon", 0) or 0)
                            elif "lng" in loc:
                                lon = float(loc.get("lng", 0) or 0)
                            elif "longitude" in loc:
                                lon = float(loc.get("longitude", 0) or 0)
                            
                            # Проверяем GeoJSON формат coordinates: [lon, lat]
                            if "coordinates" in loc:
                                coords = loc["coordinates"]
                                if isinstance(coords, list) and len(coords) >= 2:
                                    lon = float(coords[0] or 0)
                                    lat = float(coords[1] or 0)
                        elif isinstance(loc, list) and len(loc) >= 2:
                            # Если location - это массив [lon, lat]
                            lon = float(loc[0] or 0)
                            lat = float(loc[1] or 0)
                    
                    # Если координаты не найдены, используем координаты Алматы с уникальным смещением
                    if lat is None or lat == 0 or lon is None or lon == 0:
                        # Используем координаты Алматы с небольшим случайным смещением для визуализации
                        base_lat = 43.2220
                        base_lon = 76.8512
                        # Создаем уникальное смещение на основе device_id
                        import hashlib
                        hash_obj = hashlib.md5(str(device_id).encode())
                        hash_int = int(hash_obj.hexdigest()[:8], 16)
                        # Смещение до 0.05 градуса (примерно 5.5 км)
                        lat_offset = (hash_int % 1000) / 20000 - 0.025
                        lon_offset = ((hash_int // 1000) % 1000) / 20000 - 0.025
                        lat = base_lat + lat_offset
                        lon = base_lon + lon_offset
                        print(f"Warning: No coordinates found for device {device_id}, using offset: {lat:.4f}, {lon:.4f}")
                    
                    all_data.append({
                        "city": "Almaty",
                        "state": "Almaty",
                        "country": "Kazakhstan",
                        "location": {
                            "type": "Point",
                            "coordinates": [lon, lat]
                        },
                        "current": {
                            "pollution": {
                                "ts": datetime.utcnow().isoformat(),
                                "aqius": aqius,
                                "mainus": "pm25",
                                "aqicn": aqius,
                                "maincn": "pm25",
                                "pm1": float(sensor.get("pm1", 0) or 0),
                                "pm25": float(sensor.get("pm25", 0) or 0),
                                "pm10": float(sensor.get("pm10", 0) or 0),
                                "co2": float(sensor.get("co2", 0) or 0),
                                "voc": float(sensor.get("voc", 0) or 0),
                                "ch2o": float(sensor.get("ch2o", 0) or 0),
                                "co": float(sensor.get("co", 0) or 0),
                                "o3": float(sensor.get("o3", 0) or 0),
                                "no2": float(sensor.get("no2", 0) or 0),
                            },
                            "weather": {
                                "ts": datetime.utcnow().isoformat(),
                                "tp": float(sensor.get("temp", 0) or 0),
                                "pr": 1013,
                                "hu": float(sensor.get("hum", 0) or 0),
                                "ws": 0,
                                "wd": 0,
                                "ic": "01d"
                            }
                        },
                        "sensor_data": {
                            "device_id": sensor.get("device_id", ""),
                            "site": sensor.get("site", ""),
                            "danger_level": sensor.get("danger_level", "safe")
                        }
                    })
                except Exception as e:
                    print(f"Error processing sensor {sensor.get('device_id', 'unknown')}: {e}")
                    continue
        
        # Генерируем тестовые данные для городов по всему миру
        print("Adding global test points with different danger levels...")
        
        # Мировые города с разными уровнями загрязнения
        global_cities = [
                   # Азия
                   {"city": "Almaty", "country": "Kazakhstan", "lat": 43.2220, "lon": 76.8512, "pm25": 65.0, "pm10": 85.0, "aqi": 65, "danger": "moderate"},
                   {"city": "Beijing", "country": "China", "lat": 39.9042, "lon": 116.4074, "pm25": 180.0, "pm10": 220.0, "aqi": 180, "danger": "unhealthy"},
                   {"city": "Delhi", "country": "India", "lat": 28.6139, "lon": 77.2090, "pm25": 250.0, "pm10": 300.0, "aqi": 250, "danger": "very_unhealthy"},
                   {"city": "Tokyo", "country": "Japan", "lat": 35.6762, "lon": 139.6503, "pm25": 45.0, "pm10": 60.0, "aqi": 45, "danger": "safe"},
                   {"city": "Seoul", "country": "South Korea", "lat": 37.5665, "lon": 126.9780, "pm25": 85.0, "pm10": 110.0, "aqi": 85, "danger": "moderate"},
                   {"city": "Bangkok", "country": "Thailand", "lat": 13.7563, "lon": 100.5018, "pm25": 120.0, "pm10": 150.0, "aqi": 120, "danger": "unhealthy_sensitive"},
                   {"city": "Jakarta", "country": "Indonesia", "lat": -6.2088, "lon": 106.8456, "pm25": 140.0, "pm10": 180.0, "aqi": 140, "danger": "unhealthy_sensitive"},
                   {"city": "Mumbai", "country": "India", "lat": 19.0760, "lon": 72.8777, "pm25": 220.0, "pm10": 280.0, "aqi": 220, "danger": "very_unhealthy"},
                   {"city": "Shanghai", "country": "China", "lat": 31.2304, "lon": 121.4737, "pm25": 160.0, "pm10": 200.0, "aqi": 160, "danger": "unhealthy"},
                   {"city": "Dubai", "country": "UAE", "lat": 25.2048, "lon": 55.2708, "pm25": 95.0, "pm10": 125.0, "aqi": 95, "danger": "moderate"},
                   
                   # Европа
                   {"city": "London", "country": "UK", "lat": 51.5074, "lon": -0.1278, "pm25": 35.0, "pm10": 50.0, "aqi": 35, "danger": "safe"},
                   {"city": "Paris", "country": "France", "lat": 48.8566, "lon": 2.3522, "pm25": 40.0, "pm10": 55.0, "aqi": 40, "danger": "safe"},
                   {"city": "Berlin", "country": "Germany", "lat": 52.5200, "lon": 13.4050, "pm25": 30.0, "pm10": 45.0, "aqi": 30, "danger": "safe"},
                   {"city": "Moscow", "country": "Russia", "lat": 55.7558, "lon": 37.6173, "pm25": 55.0, "pm10": 75.0, "aqi": 55, "danger": "moderate"},
                   {"city": "Rome", "country": "Italy", "lat": 41.9028, "lon": 12.4964, "pm25": 50.0, "pm10": 70.0, "aqi": 50, "danger": "safe"},
                   {"city": "Madrid", "country": "Spain", "lat": 40.4168, "lon": -3.7038, "pm25": 38.0, "pm10": 52.0, "aqi": 38, "danger": "safe"},
                   {"city": "Warsaw", "country": "Poland", "lat": 52.2297, "lon": 21.0122, "pm25": 60.0, "pm10": 80.0, "aqi": 60, "danger": "moderate"},
                   {"city": "Istanbul", "country": "Turkey", "lat": 41.0082, "lon": 28.9784, "pm25": 75.0, "pm10": 100.0, "aqi": 75, "danger": "moderate"},
                   
                   # Северная Америка
                   {"city": "New York", "country": "USA", "lat": 40.7128, "lon": -74.0060, "pm25": 42.0, "pm10": 58.0, "aqi": 42, "danger": "safe"},
                   {"city": "Los Angeles", "country": "USA", "lat": 34.0522, "lon": -118.2437, "pm25": 65.0, "pm10": 85.0, "aqi": 65, "danger": "moderate"},
                   {"city": "Chicago", "country": "USA", "lat": 41.8781, "lon": -87.6298, "pm25": 48.0, "pm10": 65.0, "aqi": 48, "danger": "safe"},
                   {"city": "Toronto", "country": "Canada", "lat": 43.6532, "lon": -79.3832, "pm25": 28.0, "pm10": 40.0, "aqi": 28, "danger": "safe"},
                   {"city": "Mexico City", "country": "Mexico", "lat": 19.4326, "lon": -99.1332, "pm25": 110.0, "pm10": 140.0, "aqi": 110, "danger": "unhealthy_sensitive"},
                   
                   # Южная Америка
                   {"city": "São Paulo", "country": "Brazil", "lat": -23.5505, "lon": -46.6333, "pm25": 70.0, "pm10": 90.0, "aqi": 70, "danger": "moderate"},
                   {"city": "Buenos Aires", "country": "Argentina", "lat": -34.6037, "lon": -58.3816, "pm25": 52.0, "pm10": 72.0, "aqi": 52, "danger": "moderate"},
                   {"city": "Lima", "country": "Peru", "lat": -12.0464, "lon": -77.0428, "pm25": 80.0, "pm10": 105.0, "aqi": 80, "danger": "moderate"},
                   
                   # Африка
                   {"city": "Cairo", "country": "Egypt", "lat": 30.0444, "lon": 31.2357, "pm25": 130.0, "pm10": 170.0, "aqi": 130, "danger": "unhealthy_sensitive"},
                   {"city": "Lagos", "country": "Nigeria", "lat": 6.5244, "lon": 3.3792, "pm25": 150.0, "pm10": 190.0, "aqi": 150, "danger": "unhealthy"},
                   {"city": "Johannesburg", "country": "South Africa", "lat": -26.2041, "lon": 28.0473, "pm25": 58.0, "pm10": 78.0, "aqi": 58, "danger": "moderate"},
                   
                   # Австралия и Океания
                   {"city": "Sydney", "country": "Australia", "lat": -33.8688, "lon": 151.2093, "pm25": 25.0, "pm10": 35.0, "aqi": 25, "danger": "safe"},
                   {"city": "Melbourne", "country": "Australia", "lat": -37.8136, "lon": 144.9631, "pm25": 22.0, "pm10": 32.0, "aqi": 22, "danger": "safe"},
        ]
        
        test_points = []
        for idx, city_data in enumerate(global_cities):
            test_points.append({
                "device_id": f"global_{idx+1:03d}",
                "site": city_data["city"],
                "pm25": city_data["pm25"],
                "pm10": city_data["pm10"],
                "pm1": city_data["pm25"] * 0.4,
                "co2": 400 + (city_data["aqi"] * 2),
                "voc": 0.5 + (city_data["aqi"] / 100),
                "temp": 20 + (idx % 15),
                "hum": 50 + (idx % 30),
                "ch2o": 0.02 + (city_data["aqi"] / 1000),
                "co": 0.1 + (city_data["aqi"] / 200),
                "o3": 20 + (city_data["aqi"] / 3),
                "no2": 15 + (city_data["aqi"] / 4),
                "lat": city_data["lat"],
                "lon": city_data["lon"],
                "danger": city_data["danger"],
                "city": city_data["city"],
                "country": city_data["country"]
            })
        
        for test_point in test_points:
            try:
                pm25 = float(test_point.get("pm25", 0) or 0)
                aqius = calculate_aqi(pm25)
                lat = float(test_point.get("lat", 0) or 0)
                lon = float(test_point.get("lon", 0) or 0)
                
                all_data.append({
                    "city": test_point.get("city", "Almaty"),
                    "state": test_point.get("city", "Almaty"),
                    "country": test_point.get("country", "Kazakhstan"),
                    "location": {
                        "type": "Point",
                        "coordinates": [lon, lat]
                    },
                    "current": {
                        "pollution": {
                            "ts": datetime.utcnow().isoformat(),
                            "aqius": aqius,
                            "mainus": "pm25",
                            "aqicn": aqius,
                            "maincn": "pm25",
                            "pm1": float(test_point.get("pm1", 0) or 0),
                            "pm25": float(test_point.get("pm25", 0) or 0),
                            "pm10": float(test_point.get("pm10", 0) or 0),
                            "co2": float(test_point.get("co2", 0) or 0),
                            "voc": float(test_point.get("voc", 0) or 0),
                            "ch2o": float(test_point.get("ch2o", 0) or 0),
                            "co": float(test_point.get("co", 0) or 0),
                            "o3": float(test_point.get("o3", 0) or 0),
                            "no2": float(test_point.get("no2", 0) or 0),
                        },
                        "weather": {
                            "ts": datetime.utcnow().isoformat(),
                            "tp": float(test_point.get("temp", 0) or 0),
                            "pr": 1013,
                            "hu": float(test_point.get("hum", 0) or 0),
                            "ws": 0,
                            "wd": 0,
                            "ic": "01d"
                        }
                    },
                    "sensor_data": {
                        "device_id": test_point.get("device_id", ""),
                        "site": test_point.get("site", ""),
                        "danger_level": test_point.get("danger", "safe")
                    }
                })
            except Exception as e:
                print(f"Error creating test point: {e}")
                continue
        
        # Возвращаем данные (реальные + тестовые если нужно)
        print(f"=== FINAL RESULT: Returning {len(all_data)} data points ===")
        if len(all_data) > 0:
            print(f"First point device_id: {all_data[0].get('sensor_data', {}).get('device_id', 'unknown')}")
            if len(all_data) > 1:
                print(f"Second point device_id: {all_data[1].get('sensor_data', {}).get('device_id', 'unknown')}")
        return {"data": all_data}
    except Exception as e:
        print(f"Error in get_all_air_quality_data: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/cities")
async def get_supported_cities(current_user: dict = Depends(get_current_user)):
    # Get list of cities from MongoDB or return popular cities
    cities = await db.cities.find({}).to_list(100)
    if not cities:
        # Default cities - только Алматы
        default_cities = [
            {"city": "Almaty", "state": "Almaty", "country": "Kazakhstan", "lat": 43.2220, "lon": 76.8512},
        ]
        return {"cities": default_cities}
    
    # Фильтруем только Алматы
    almaty_cities = [c for c in cities if c.get("city", "").lower() == "almaty" and c.get("country", "").lower() == "kazakhstan"]
    if not almaty_cities:
        default_cities = [
            {"city": "Almaty", "state": "Almaty", "country": "Kazakhstan", "lat": 43.2220, "lon": 76.8512},
        ]
        return {"cities": default_cities}
    
    return {"cities": almaty_cities}

@app.post("/air-quality/save")
async def save_air_quality_data(
    data: AirQualityData,
    current_user: dict = Depends(get_current_user)
):
    # Save air quality data to MongoDB
    data_dict = data.dict()
    data_dict["user_id"] = str(current_user["_id"])
    data_dict["timestamp"] = datetime.utcnow()
    
    result = await db.air_quality_history.insert_one(data_dict)
    return {"id": str(result.inserted_id), "message": "Data saved successfully"}


# -------------------------
# Admin & paid sensors flow
# -------------------------
@app.post("/admin/sensors", response_model=SensorResponse)
async def create_sensor(sensor: SensorBase, current_user: dict = Depends(require_admin)):
    sensor_doc = sensor.dict()
    sensor_doc["created_at"] = datetime.utcnow()
    result = await db.sensors.insert_one(sensor_doc)
    sensor_doc["_id"] = result.inserted_id
    return sensor_to_response(sensor_doc)


@app.get("/admin/sensors")
async def list_sensors(current_user: dict = Depends(require_admin)):
    sensors = await db.sensors.find({}).to_list(500)
    return {"data": [sensor_to_response(s) for s in sensors]}


@app.get("/admin/users")
async def list_users(current_user: dict = Depends(require_admin)):
    users = await db.users.find({}).to_list(500)
    return {
        "data": [
            {
                "id": str(u.get("_id")),
                "email": u.get("email"),
                "name": u.get("name"),
                "role": u.get("role", "user"),
                "sensor_permissions": u.get("sensor_permissions", []),
            }
            for u in users
        ]
    }


@app.post("/admin/users/make-admin")
async def make_admin(request: MakeAdminRequest, current_user: dict = Depends(require_admin)):
    result = await db.users.update_one(
        {"email": request.email},
        {"$set": {"role": "admin"}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": f"User {request.email} is now admin"}


@app.post("/admin/sensors/{sensor_id}/grant")
async def grant_sensor_access(sensor_id: str, request: GrantAccessRequest, current_user: dict = Depends(require_admin)):
    if not ObjectId.is_valid(sensor_id):
        raise HTTPException(status_code=400, detail="Invalid sensor id")
    sensor = await db.sensors.find_one({"_id": ObjectId(sensor_id)})
    if not sensor:
        raise HTTPException(status_code=404, detail="Sensor not found")
    
    user = await db.users.find_one({"email": request.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$addToSet": {"sensor_permissions": str(sensor["_id"])}}
    )
    return {"message": f"Access to sensor {sensor_id} granted for {request.email}"}


@app.post("/purchase/sensors/{sensor_id}")
async def purchase_sensor(sensor_id: str, current_user: dict = Depends(get_current_user)):
    try:
        # Проверяем, является ли пользователь мок-админом
        if current_user.get("_id") == "admin":
            raise HTTPException(status_code=403, detail="Admin users cannot purchase sensors")
        
        if not ObjectId.is_valid(sensor_id):
            raise HTTPException(status_code=400, detail="Invalid sensor id")
        sensor = await db.sensors.find_one({"_id": ObjectId(sensor_id)})
        if not sensor:
            raise HTTPException(status_code=404, detail="Sensor not found")
        
        # Получаем актуальный user_id
        user_id = current_user.get("_id")
        if isinstance(user_id, str) and ObjectId.is_valid(user_id):
            user_id = ObjectId(user_id)
        elif not isinstance(user_id, ObjectId):
            raise HTTPException(status_code=400, detail="Invalid user ID")
        
        # Обновляем права пользователя
        result = await db.users.update_one(
            {"_id": user_id},
            {"$addToSet": {"sensor_permissions": str(sensor["_id"])}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        print(f"✅ Sensor {sensor_id} purchased by user {user_id}")
        print(f"   Updated permissions: {result.modified_count > 0}")
        
        # Запишем покупку для истории
        await db.purchases.insert_one({
            "user_id": str(user_id),
            "sensor_id": str(sensor["_id"]),
            "timestamp": datetime.utcnow(),
            "status": "paid"
        })
        
        return {"message": "Sensor purchased successfully", "sensor": sensor_to_response(sensor)}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in purchase_sensor: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/me/sensors")
async def get_my_sensors(current_user: dict = Depends(get_current_user)):
    try:
        # Проверяем, является ли пользователь мок-админом
        if current_user.get("_id") == "admin":
            # Для мок-админа возвращаем пустой список (админы не покупают датчики)
            return {"data": []}
        
        # Обновляем данные пользователя из базы, чтобы получить актуальные sensor_permissions
        user_id = current_user.get("_id")
        if isinstance(user_id, str) and ObjectId.is_valid(user_id):
            user_id = ObjectId(user_id)
        elif not isinstance(user_id, ObjectId):
            raise HTTPException(status_code=400, detail="Invalid user ID")
        
        user = await db.users.find_one({"_id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        sensor_ids = user.get("sensor_permissions", []) or []
        object_ids = [ObjectId(sid) for sid in sensor_ids if ObjectId.is_valid(sid)]
        if not object_ids:
            return {"data": []}
        sensors = await db.sensors.find({"_id": {"$in": object_ids}}).to_list(500)
        return {"data": [sensor_to_response(s) for s in sensors]}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in get_my_sensors: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/sensors/available")
async def get_available_sensors(current_user: dict = Depends(get_current_user)):
    """
    Возвращает все датчики, доступные для покупки (исключая уже купленные пользователем).
    """
    try:
        # Проверяем, является ли пользователь мок-админом
        if current_user.get("_id") == "admin":
            # Для мок-админа возвращаем все датчики как доступные
            all_sensors = await db.sensors.find({}).to_list(500)
            return {"data": [sensor_to_response(s) for s in all_sensors]}
        
        # Обновляем данные пользователя из базы, чтобы получить актуальные sensor_permissions
        user_id = current_user.get("_id")
        if isinstance(user_id, str) and ObjectId.is_valid(user_id):
            user_id = ObjectId(user_id)
        elif not isinstance(user_id, ObjectId):
            raise HTTPException(status_code=400, detail="Invalid user ID")
        
        user = await db.users.find_one({"_id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_sensor_ids = set(user.get("sensor_permissions", []) or [])
        all_sensors = await db.sensors.find({}).to_list(500)
        
        print(f"🔍 Available sensors check:")
        print(f"  - Total sensors in DB: {len(all_sensors)}")
        print(f"  - User sensor permissions: {user_sensor_ids}")
        
        available = []
        for sensor in all_sensors:
            sensor_id_str = str(sensor.get("_id"))
            if sensor_id_str not in user_sensor_ids:
                available.append(sensor_to_response(sensor))
        
        print(f"  - Available sensors: {len(available)}")
        return {"data": available}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in get_available_sensors: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/sensors/all")
async def get_all_sensors_with_status(current_user: dict = Depends(get_current_user)):
    """
    Возвращает все датчики с флагом is_purchased для текущего пользователя.
    """
    try:
        is_admin, user_id = safe_get_user_id(current_user)
        
        # Если мок-админ, возвращаем все датчики как некупленные
        if is_admin:
            print("🔍 Detected mock admin user")
            all_sensors = await db.sensors.find({}).to_list(500)
            result = []
            for sensor in all_sensors:
                sensor_response = sensor_to_response(sensor)
                sensor_response["is_purchased"] = False
                result.append(sensor_response)
            return {"data": result}
        
        # Если user_id некорректный, возвращаем пустой список
        if user_id is None:
            print("⚠️ Invalid user_id, returning empty list")
            return {"data": []}
        
        # Получаем актуальные данные пользователя из базы
        user = await db.users.find_one({"_id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_sensor_ids = set(user.get("sensor_permissions", []) or [])
        all_sensors = await db.sensors.find({}).to_list(500)
        
        print(f"🔍 All sensors check:")
        print(f"  - Total sensors in DB: {len(all_sensors)}")
        print(f"  - User sensor permissions: {user_sensor_ids}")
        
        result = []
        for sensor in all_sensors:
            sensor_id_str = str(sensor.get("_id"))
            sensor_response = sensor_to_response(sensor)
            sensor_response["is_purchased"] = sensor_id_str in user_sensor_ids
            result.append(sensor_response)
        
        print(f"  - Purchased sensors: {sum(1 for s in result if s.get('is_purchased'))}")
        return {"data": result}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in get_all_sensors_with_status: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")




@app.get("/sensors/map")
async def get_map_sensors(current_user: dict = Depends(get_current_user)):
    """
    Возвращает только те датчики, на которые у пользователя есть права (куплено или выдано админом).
    """
    try:
        # Проверяем, является ли пользователь мок-админом
        if current_user.get("_id") == "admin":
            # Для мок-админа возвращаем пустой список (админы не видят датчики на карте)
            return {"data": []}
        
        # Обновляем данные пользователя из базы, чтобы получить актуальные sensor_permissions
        user_id = current_user.get("_id")
        if isinstance(user_id, str) and ObjectId.is_valid(user_id):
            user_id = ObjectId(user_id)
        elif not isinstance(user_id, ObjectId):
            raise HTTPException(status_code=400, detail="Invalid user ID")
        
        user = await db.users.find_one({"_id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        sensor_ids = user.get("sensor_permissions", []) or []
        object_ids = [ObjectId(sid) for sid in sensor_ids if ObjectId.is_valid(sid)]
        if not object_ids:
            return {"data": []}
    
        sensors = await db.sensors.find({"_id": {"$in": object_ids}}).to_list(500)
        
        print(f"🔍 Map sensors check:")
        print(f"  - User sensor permissions: {sensor_ids}")
        print(f"  - Converted ObjectIds: {len(object_ids)}")
        print(f"  - Found sensors in DB: {len(sensors)}")
        
        map_points = []
        for sensor in sensors:
            coords = (sensor.get("location") or {}).get("coordinates")
            if not coords or len(coords) != 2:
                print(f"  ⚠️ Sensor {sensor.get('_id')} missing coordinates")
                continue
            lon, lat = coords
            params = sensor.get("parameters") or {}
            pm25_val = float(params.get("pm25", 0) or 0)
            aqi_val = calculate_aqi(pm25_val)
            map_point = {
                "id": str(sensor.get("_id")),
                "name": sensor.get("name"),
                "description": sensor.get("description"),
                "price": sensor.get("price", 0),
                "city": sensor.get("city") or "Unknown",
                "country": sensor.get("country") or "Unknown",
                "lat": lat,
                "lng": lon,
                "aqi": aqi_val,
                "parameters": params,
                "color": "#00d8ff",
                "source": "sensor",
                # Дополнительные параметры для купленных датчиков
                "co2": float(params.get("co2", 0) or 0),
                "voc": float(params.get("voc", 0) or 0),
                "temp": float(params.get("temp", 0) or 0),
                "hum": float(params.get("hum", 0) or 0),
                "ch2o": float(params.get("ch2o", 0) or 0),
                "co": float(params.get("co", 0) or 0),
                "o3": float(params.get("o3", 0) or 0),
                "no2": float(params.get("no2", 0) or 0),
            }
            map_points.append(map_point)
            print(f"  ✅ Added sensor {map_point['id']} at [{lat}, {lon}]")
        
        print(f"  📊 Total map points: {len(map_points)}")
        return {"data": map_points}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in get_map_sensors: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)


