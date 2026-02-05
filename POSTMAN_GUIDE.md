# Инструкция по использованию API в Postman

## 🔑 Шаг 1: Получение токена авторизации

### POST запрос для регистрации (опционально)
**URL:** `http://localhost:8000/register`

**Method:** `POST`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "email": "test@example.com",
  "password": "test123",
  "name": "Test User"
}
```

### POST запрос для получения токена
**URL:** `http://localhost:8000/token`

**Method:** `POST`

**Headers:**
```
Content-Type: multipart/form-data
```

**Body (form-data):**
- `username`: `test@example.com` (ваш email)
- `password`: `test123` (ваш пароль)

**Ответ:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Скопируйте `access_token` - он понадобится для всех остальных запросов!**

---

## 📊 Шаг 2: Получение данных о качестве воздуха

### GET запрос - Все точки данных
**URL:** `http://localhost:8000/air-quality/all`

**Method:** `GET`

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
```

**Пример:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ответ:**
```json
{
  "data": [
    {
      "city": "Almaty",
      "state": "Almaty",
      "country": "Kazakhstan",
      "location": {
        "type": "Point",
        "coordinates": [76.8512, 43.2220]
      },
      "current": {
        "pollution": {
          "ts": "2024-01-01T12:00:00",
          "aqius": 45,
          "pm25": 25.7,
          ...
        },
        "weather": {
          "tp": 21.8,
          "hu": 46.2,
          ...
        }
      },
      "sensor_data": {
        "device_id": "lab01",
        "site": "AGI_Lab"
      }
    }
  ]
}
```

### GET запрос - Данные по городу
**URL:** `http://localhost:8000/air-quality?city=Almaty&state=Almaty&country=Kazakhstan`

**Method:** `GET`

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
```

**Query Parameters:**
- `city`: Almaty (опционально)
- `state`: Almaty (опционально)
- `country`: Kazakhstan (опционально)
- `lat`: 43.2220 (опционально)
- `lon`: 76.8512 (опционально)

### GET запрос - Информация о пользователе
**URL:** `http://localhost:8000/me`

**Method:** `GET`

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
```

### GET запрос - Список городов
**URL:** `http://localhost:8000/cities`

**Method:** `GET`

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
```

---

## 🚀 Быстрый старт в Postman

### 1. Создайте новую коллекцию
- Нажмите "New" → "Collection"
- Назовите её "IQAir API"

### 2. Создайте переменную для токена
- В коллекции нажмите "Variables"
- Добавьте переменную:
  - **Variable:** `token`
  - **Initial Value:** (оставьте пустым)
  - **Current Value:** (оставьте пустым)

### 3. Создайте запрос для получения токена
- **Name:** "Login"
- **Method:** `POST`
- **URL:** `http://localhost:8000/token`
- **Body:** form-data
  - `username`: `test@example.com`
  - `password`: `test123`
- **Tests (опционально):**
```javascript
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    pm.collectionVariables.set("token", jsonData.access_token);
}
```

### 4. Создайте запрос для получения всех данных
- **Name:** "Get All Air Quality"
- **Method:** `GET`
- **URL:** `http://localhost:8000/air-quality/all`
- **Headers:**
  - `Authorization`: `Bearer {{token}}`

### 5. Создайте запрос для получения данных по городу
- **Name:** "Get Air Quality by City"
- **Method:** `GET`
- **URL:** `http://localhost:8000/air-quality`
- **Params:**
  - `city`: `Almaty`
  - `state`: `Almaty`
  - `country`: `Kazakhstan`
- **Headers:**
  - `Authorization`: `Bearer {{token}}`

---

## 📝 Примеры cURL команд

### Получение токена:
```bash
curl -X POST "http://localhost:8000/token" \
  -H "Content-Type: multipart/form-data" \
  -F "username=test@example.com" \
  -F "password=test123"
```

### Получение всех данных:
```bash
curl -X GET "http://localhost:8000/air-quality/all" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Получение данных по городу:
```bash
curl -X GET "http://localhost:8000/air-quality?city=Almaty&state=Almaty&country=Kazakhstan" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## ⚠️ Важные заметки

1. **Токен действителен 30 минут** - если получили 401 ошибку, получите новый токен
2. **Все запросы требуют авторизации** (кроме `/register` и `/token`)
3. **Бэкенд должен быть запущен** на `http://localhost:8000`
4. **MongoDB должен быть запущен** для работы авторизации

---

## 🔍 Проверка ответов

### Успешный ответ (200 OK):
- Данные в формате JSON
- Массив `data` с объектами качества воздуха

### Ошибка авторизации (401):
```json
{
  "detail": "Could not validate credentials"
}
```
**Решение:** Получите новый токен через `/token`

### Ошибка сервера (500):
- Проверьте логи бэкенда
- Убедитесь, что MongoDB запущен
- Проверьте, что API сенсора доступен

---

## 📌 Полезные ссылки

- **API документация:** `http://localhost:8000/docs` (Swagger UI)
- **Альтернативная документация:** `http://localhost:8000/redoc`




