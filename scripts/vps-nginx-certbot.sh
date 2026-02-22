#!/bin/bash
# Запускать на VPS под root. Устанавливает Docker, nginx, certbot, SSL и прокси.
set -e

DOMAIN=5ryx.l.time4vps.cloud
APP_DIR=/opt/treegpt

echo "=== Installing Docker..."
apt-get update -qq && apt-get install -y -qq ca-certificates curl
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian bookworm stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update -qq && apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "=== Installing nginx and certbot..."
apt-get install -y -qq nginx certbot python3-certbot-nginx

echo "=== Nginx: proxy to backend on port 80 (certbot will add HTTPS)..."
mkdir -p /var/www/certbot
cat > /etc/nginx/sites-available/treegpt << 'NGINX'
server {
    listen 80;
    listen [::]:80;
    server_name 5ryx.l.time4vps.cloud;
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX
ln -sf /etc/nginx/sites-available/treegpt /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "=== Get SSL certificate (certbot will add listen 443 to this server)..."
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email admin@"$DOMAIN" --no-eff-email

echo "=== Certbot renewal (automatic)..."
systemctl enable certbot.timer
systemctl start certbot.timer

echo "=== App dir..."
mkdir -p "$APP_DIR"
if [ ! -f "$APP_DIR/.env" ]; then
  echo "Create $APP_DIR/.env with: JWT_SECRET, MONGO_URI, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, OPENAI_API_KEY, FRONTEND_URL=https://$DOMAIN, BACKEND_URL=https://$DOMAIN"
fi

echo "Done. Start app: cd $APP_DIR && docker compose up -d"
