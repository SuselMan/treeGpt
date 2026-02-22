#!/bin/bash
# Run this on the VPS after: ssh root@80.209.232.109
set -e

echo "Installing Docker..."
apt-get update -qq && apt-get install -y -qq ca-certificates curl
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian bookworm stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update -qq && apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "Creating app directory..."
mkdir -p /opt/treegpt

echo "Opening ports 80 and 443 (if ufw is used)..."
ufw allow 80/tcp 2>/dev/null || true
ufw allow 443/tcp 2>/dev/null || true
ufw --force enable 2>/dev/null || true

echo "Setup done. Next:"
echo "1. Copy project files to /opt/treegpt (e.g. git clone or scp)"
echo "2. Create /opt/treegpt/.env with MONGO_URI, JWT_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, OPENAI_API_KEY, FRONTEND_URL=https://5ryx.l.time4vps.cloud, BACKEND_URL=https://5ryx.l.time4vps.cloud"
echo "3. For GitHub Actions: add your public SSH key to this server (authorized_keys) and put the private key in GitHub repo secrets as VPS_SSH_KEY; set VPS_HOST=80.209.232.109, VPS_USER=root"
