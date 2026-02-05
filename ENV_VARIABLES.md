# Переменные окружения (.env)

## 📁 Бэкенд (FastAPI) - файл `backend/.env`

Создайте файл `.env` в папке `backend/` со следующими переменными:

```env
# MongoDB подключение
MONGO_URL=mongodb://localhost:27017
DATABASE_NAME=iqair

# Безопасность (JWT токены)
SECRET_KEY=your-secret-key-change-in-production-min-32-characters-long

# IQAir API (опционально - если нет ключа, используются mock данные)
IQAIR_API_KEY=your-iqair-api-key-here
```

### Описание переменных бэкенда:

#### `MONGO_URL` (обязательно)
- **Описание**: URL подключения к MongoDB
- **Формат**: `mongodb://host:port` или `mongodb://username:password@host:port/database`
- **Примеры**:
  - Локально: `mongodb://localhost:27017`
  - MongoDB Atlas: `mongodb+srv://username:password@cluster.mongodb.net/`
  - С аутентификацией: `mongodb://user:pass@localhost:27017/`

#### `DATABASE_NAME` (обязательно)
- **Описание**: Имя базы данных MongoDB
- **По умолчанию**: `iqair`
- **Пример**: `iqair`, `air_quality_db`

#### `SECRET_KEY` (обязательно)
- **Описание**: Секретный ключ для подписи JWT токенов
- **Требования**: Минимум 32 символа, используйте случайную строку
- **Как сгенерировать**:
  ```python
  import secrets
  print(secrets.token_urlsafe(32))
  ```
- **Пример**: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6`

#### `IQAIR_API_KEY` (опционально)
- **Описание**: API ключ от IQAir для получения реальных данных о качестве воздуха
- **Где получить**: https://www.iqair.com/us/air-pollution-data-api
- **Примечание**: Если не указан, приложение будет использовать mock данные для тестирования
- **Пример**: `12345678-1234-1234-1234-123456789abc`

---

## 📁 Фронтенд (Next.js) - файл `frontend/.env.local`

Создайте файл `.env.local` в папке `frontend/` со следующими переменными:

```env
# URL бэкенд API
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Описание переменных фронтенда:

#### `NEXT_PUBLIC_API_URL` (обязательно)
- **Описание**: URL бэкенд API сервера
- **Формат**: `http://host:port` или `https://domain.com`
- **Примеры**:
  - Локальная разработка: `http://localhost:8000`
  - Продакшн: `https://api.yourdomain.com`
  - Docker: `http://backend:8000`

**Важно**: В Next.js переменные, которые должны быть доступны в браузере, должны начинаться с `NEXT_PUBLIC_`

---

## 🚀 Быстрая настройка

### Шаг 1: Создайте файл для бэкенда

```bash
cd backend
copy env.example .env
# или на Linux/Mac: cp env.example .env
```

Затем отредактируйте `.env` и заполните значения:

```env
MONGO_URL=mongodb://localhost:27017
DATABASE_NAME=iqair
SECRET_KEY=сгенерируйте-случайную-строку-минимум-32-символа
IQAIR_API_KEY=ваш-ключ-или-оставьте-пустым
```

### Шаг 2: Создайте файл для фронтенда

```bash
cd frontend
copy env.local.example .env.local
# или на Linux/Mac: cp env.local.example .env.local
```

Затем отредактируйте `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🔐 Генерация SECRET_KEY

### Python:
```python
import secrets
print(secrets.token_urlsafe(32))
```

### PowerShell (Windows):
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

### Bash (Linux/Mac):
```bash
openssl rand -base64 32
```

---

## 📝 Примеры готовых .env файлов

### backend/.env (минимальная конфигурация)
```env
MONGO_URL=mongodb://localhost:27017
DATABASE_NAME=iqair
SECRET_KEY=my-super-secret-key-change-this-in-production-12345
IQAIR_API_KEY=
```

### backend/.env (с MongoDB Atlas)
```env
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/
DATABASE_NAME=iqair
SECRET_KEY=my-super-secret-key-change-this-in-production-12345
IQAIR_API_KEY=abc123def456ghi789
```

### frontend/.env.local (локальная разработка)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### frontend/.env.local (продакшн)
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

---

## ⚠️ Важные замечания

1. **Никогда не коммитьте `.env` файлы в Git!** Они уже добавлены в `.gitignore`
2. **SECRET_KEY** должен быть уникальным и секретным в продакшне
3. **IQAIR_API_KEY** опционален - приложение работает и без него (с mock данными)
4. После изменения `.env` файлов перезапустите серверы
5. В Next.js только переменные с префиксом `NEXT_PUBLIC_` доступны в браузере

---

## 🔍 Проверка переменных

### Проверка бэкенда:
```python
# В Python консоли
import os
from dotenv import load_dotenv
load_dotenv()
print("MONGO_URL:", os.getenv("MONGO_URL"))
print("SECRET_KEY:", "***" if os.getenv("SECRET_KEY") else "NOT SET")
```

### Проверка фронтенда:
```javascript
// В браузерной консоли
console.log("API URL:", process.env.NEXT_PUBLIC_API_URL);
```





