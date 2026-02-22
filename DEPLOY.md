# Деплой TreeGPT на VPS

Используются **nginx** и **certbot** (HTTPS с автообновлением). Деплой из GitHub Actions по **логину и паролю** (без SSH-ключа).

---

## 1. Подготовка VPS (один раз)

Подключись по SSH:

```bash
ssh root@80.209.232.109
```

Пароль: тот, что выдал хостинг (например `I5w5W4zZi0zZ`).

### Вариант А: запустить скрипт из репозитория

После того как файлы уже есть на VPS (см. ниже «Первый деплой»), выполни на VPS:

```bash
cd /opt/treegpt
chmod +x scripts/vps-nginx-certbot.sh
./scripts/vps-nginx-certbot.sh
```

Скрипт установит Docker, nginx, certbot, получит сертификат для `5ryx.l.time4vps.cloud` и настроит прокси на контейнер с приложением.

### Вариант Б: установить всё вручную

Если скрипта ещё нет, выполни по шагам:

```bash
# Docker
apt-get update && apt-get install -y ca-certificates curl
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian bookworm stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update && apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# nginx и certbot
apt-get install -y nginx certbot python3-certbot-nginx

# Порты
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

mkdir -p /opt/treegpt
```

Дальше нужно один раз скопировать проект на VPS (см. раздел «Первый деплой»), затем снова зайти по SSH и запустить `scripts/vps-nginx-certbot.sh` (или дописать nginx вручную и вызвать `certbot --nginx -d 5ryx.l.time4vps.cloud`).

---

## 2. Создать `.env` на VPS

На сервере создай файл `/opt/treegpt/.env` (например `nano /opt/treegpt/.env`):

```env
JWT_SECRET=длинная_случайная_строка
MONGO_URI=mongodb://mongo:27017/treegpt
GOOGLE_CLIENT_ID=твой_client_id
GOOGLE_CLIENT_SECRET=твой_client_secret
OPENAI_API_KEY=твой_openai_key
FRONTEND_URL=https://5ryx.l.time4vps.cloud
BACKEND_URL=https://5ryx.l.time4vps.cloud
```

В Google Cloud Console добавь **Authorized redirect URI**:  
`https://5ryx.l.time4vps.cloud/api/auth/google/callback`

---

## 3. Секреты GitHub (логин и пароль)

Репозиторий → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

| Name            | Value              |
|-----------------|--------------------|
| `VPS_HOST`      | `80.209.232.109`   |
| `VPS_USER`      | `root`             |
| `VPS_PASSWORD`  | пароль от VPS      |

Используется **пароль**, не SSH-ключ.

---

## 4. Первый деплой

### Шаг 1: скопировать проект на VPS

С локальной машины (из каталога проекта):

```bash
scp -r backend frontend docker-compose.yml Dockerfile .env.example nginx scripts root@80.209.232.109:/opt/treegpt/
```

Создай на VPS `/opt/treegpt/.env` (п. 2).

### Шаг 2: nginx и certbot на VPS

По SSH:

```bash
ssh root@80.209.232.109
cd /opt/treegpt
chmod +x scripts/vps-nginx-certbot.sh
./scripts/vps-nginx-certbot.sh
```

### Шаг 3: запуск приложения

На VPS:

```bash
cd /opt/treegpt
docker compose build --no-cache
docker compose up -d
```

Дальше при каждом push в `main` GitHub Actions сам скопирует файлы и выполнит `docker compose up -d`. Файл `.env` на сервере не перезаписывается.

---

## 5. Обновление сертификата (certbot)

Продление сертификатов настроено через таймер:

```bash
systemctl status certbot.timer
```

При необходимости вручную:

```bash
certbot renew
systemctl reload nginx
```

---

## 6. Проверка

Открой в браузере: **https://5ryx.l.time4vps.cloud**

---

**Важно:** не коммить в репозиторий файлы с паролями и ключами. Пароль VPS храни только в GitHub Secrets.
