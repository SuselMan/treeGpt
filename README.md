# TreeGPT — Branching Chat MVP

Чат с LLM и ветвящимися тредами (каждый тред = отдельный чат).

## Стек

- **Backend:** Node.js, TypeScript, Express, MongoDB (Mongoose), JWT, Google OAuth2, OpenAI
- **Frontend:** React, TypeScript, Vite, react-markdown + remark-gfm + rehype-sanitize
- **Deploy:** Docker, Caddy (HTTPS с авто-сертификатами), VPS

## Локальный запуск

1. **Backend**
   ```bash
   cd backend
   cp ../.env.example .env   # заполнить переменные
   npm install && npm run dev
   ```

2. **Frontend**
   ```bash
   cd frontend
   npm install && npm run dev
   ```

3. **MongoDB** — запущен локально на `localhost:27017` или укажи `MONGO_URI` в `.env`.

## Переменные окружения

См. `.env.example`. Нужны: `MONGO_URI`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `OPENAI_API_KEY`. В production: `FRONTEND_URL`, `BACKEND_URL` (полные URL домена).

## Деплой на VPS

### Первоначальная настройка VPS (один раз)

1. Подключись по SSH: `ssh root@80.209.232.109`
2. Установи Docker и Docker Compose (если ещё нет):
   ```bash
   apt-get update && apt-get install -y ca-certificates curl
   install -m 0755 -d /etc/apt/keyrings
   curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
   echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian bookworm stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
   apt-get update && apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
   ```
3. Создай каталог и `.env`:
   ```bash
   mkdir -p /opt/treegpt
   # Создай /opt/treegpt/.env с переменными (MONGO_URI, JWT_SECRET, GOOGLE_*, OPENAI_API_KEY, FRONTEND_URL, BACKEND_URL)
   ```
4. Открой порты 80 и 443 (ufw или панель хостера).

### GitHub Actions (деплой при push в main)

В настройках репозитория GitHub → Settings → Secrets and variables → Actions добавь:

- `VPS_HOST` — IP или хост VPS (например `80.209.232.109`)
- `VPS_USER` — пользователь SSH (например `root`)
- `VPS_SSH_KEY` — приватный SSH-ключ для доступа к VPS (содержимое `id_rsa` или аналог)

После push в `main` workflow скопирует файлы на VPS и запустит `docker compose up -d`. На VPS должен быть уже создан `/opt/treegpt/.env` (см. выше).

### Ручной деплой

На VPS в `/opt/treegpt` положи файлы (git clone или scp), создай `.env`, затем:

```bash
cd /opt/treegpt
docker compose build --no-cache
docker compose up -d
```

HTTPS обеспечивает Caddy: сертификаты Let's Encrypt получаются автоматически для домена из `Caddyfile` (сейчас `5ryx.l.time4vps.cloud`).
