# Инструкция по установке

## Быстрый старт

### 1. Установка MongoDB

Скачайте и установите MongoDB с официального сайта: https://www.mongodb.com/try/download/community

Или используйте MongoDB Atlas (облачный сервис): https://www.mongodb.com/cloud/atlas

### 2. Запуск бэкенда

#### Windows:
```bash
start-backend.bat
```

#### Linux/Mac:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

Бэкенд будет доступен на: http://localhost:8000
API документация: http://localhost:8000/docs

### 3. Запуск фронтенда

#### Windows:
```bash
start-frontend.bat
```

#### Linux/Mac:
```bash
cd frontend
npm install
npm run dev
```

Фронтенд будет доступен на: http://localhost:3000

## Настройка переменных окружения

### Бэкенд (.env в папке backend/)

Создайте файл `.env` в папке `backend/`:

```env
MONGO_URL=mongodb://localhost:27017
DATABASE_NAME=iqair
SECRET_KEY=your-secret-key-change-in-production-min-32-chars
IQAIR_API_KEY=your-iqair-api-key-here
```

**Примечание:** Если у вас нет API ключа IQAir, приложение будет использовать mock данные для тестирования.

### Фронтенд (.env.local в папке frontend/)

Создайте файл `.env.local` в папке `frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Получение API ключа IQAir (опционально)

1. Зарегистрируйтесь на https://www.iqair.com/
2. Перейдите в раздел API
3. Получите бесплатный API ключ
4. Добавьте его в `.env` файл бэкенда

## Устранение проблем

### MongoDB не запускается
- Убедитесь, что MongoDB установлен и запущен
- Проверьте, что порт 27017 свободен
- Для Windows: проверьте службу MongoDB в диспетчере задач

### Ошибки при установке зависимостей
- Убедитесь, что у вас установлен Python 3.8+
- Убедитесь, что у вас установлен Node.js 18+
- Попробуйте обновить pip: `python -m pip install --upgrade pip`
- Попробуйте очистить кэш npm: `npm cache clean --force`

### Проблемы с CORS
- Убедитесь, что фронтенд запущен на порту 3000
- Проверьте настройки CORS в `backend/main.py`

## Структура проекта

```
iqair/
├── backend/              # FastAPI бэкенд
│   ├── main.py          # Основной файл приложения
│   ├── requirements.txt # Python зависимости
│   ├── run.py           # Скрипт запуска
│   └── .env             # Переменные окружения (создать вручную)
├── frontend/            # Next.js фронтенд
│   ├── app/             # Next.js App Router
│   ├── components/      # React компоненты
│   ├── lib/             # Утилиты и API клиент
│   └── .env.local       # Переменные окружения (создать вручную)
├── start-backend.bat    # Скрипт запуска бэкенда (Windows)
├── start-frontend.bat   # Скрипт запуска фронтенда (Windows)
└── README.md            # Основная документация
```

## Использование

1. Запустите MongoDB
2. Запустите бэкенд (порт 8000)
3. Запустите фронтенд (порт 3000)
4. Откройте http://localhost:3000 в браузере
5. Зарегистрируйтесь или войдите
6. Выберите город и просмотрите данные о качестве воздуха





