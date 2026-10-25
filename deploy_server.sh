#!/usr/bin/env bash
# ==============================================================================
# UK Wind Power Forecast & Accuracy Evaluation Portal
# Automated Subdomain Deployment Script for Oracle Cloud Ubuntu VM
# Target Subdomain: wind.suryadeals.com (or custom parameter)
# ==============================================================================

set -e

DOMAIN="${1:-wind.suryadeals.com}"
APP_DIR="/opt/wind-app"
WEB_DIR="/var/www/wind"
REPO_URL="https://github.com/somanisuryateja/wind-kjhwr.git"
SERVICE_NAME="wind-backend"

echo "=========================================================="
echo "⚡ Deploying UK Wind Forecast Portal to Subdomain: $DOMAIN"
echo "=========================================================="

# 1. Install prerequisites if missing
echo "[1/6] Installing necessary packages (Python, Node, Nginx, Certbot)..."
sudo apt-get update -y
sudo apt-get install -y python3 python3-venv python3-pip git nginx curl certbot python3-certbot-nginx

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "✓ Node version: $(node -v)"
echo "✓ NPM version: $(npm -v)"
echo "✓ Python version: $(python3 --version)"

# 2. Clone or update repository
echo "[2/6] Syncing latest codebase from GitHub..."
if [ -d "$APP_DIR/.git" ]; then
    cd "$APP_DIR"
    sudo git fetch origin main
    sudo git reset --hard origin/main
else
    sudo rm -rf "$APP_DIR"
    sudo git clone "$REPO_URL" "$APP_DIR"
fi
sudo chown -R ubuntu:ubuntu "$APP_DIR"

# 3. Setup Python Backend & Virtual Environment
echo "[3/6] Setting up FastAPI backend virtual environment..."
cd "$APP_DIR/backend"
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Create systemd service
echo "[4/6] Configuring systemd background service: $SERVICE_NAME..."
sudo tee /etc/systemd/system/${SERVICE_NAME}.service > /dev/null <<EOF
[Unit]
Description=UK Wind Forecast Utility FastAPI Backend
After=network.target

[Service]
User=ubuntu
WorkingDirectory=$APP_DIR/backend
ExecStart=$APP_DIR/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=3
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable ${SERVICE_NAME}
sudo systemctl restart ${SERVICE_NAME}

# Wait 2 seconds and verify backend health
sleep 2
if curl -s http://127.0.0.1:8000/api/health | grep -q "healthy"; then
    echo "✓ Backend service is HEALTHY on 127.0.0.1:8000"
else
    echo "⚠ Warning: Backend service status check:"
    sudo systemctl status ${SERVICE_NAME} --no-pager || true
fi

# 5. Build React Vite Frontend
echo "[5/6] Building production frontend bundle for root /..."
cd "$APP_DIR/frontend"
npm install
npm run build

sudo mkdir -p "$WEB_DIR"
sudo rm -rf "$WEB_DIR"/*
sudo cp -r dist/* "$WEB_DIR"/
sudo chown -R www-data:www-data "$WEB_DIR"
sudo chmod -R 755 "$WEB_DIR"

# 6. Configure Dedicated Nginx Virtual Host for Subdomain
echo "[6/6] Creating Nginx virtual host for $DOMAIN..."

NGINX_SITE_CONF="/etc/nginx/sites-available/$DOMAIN"

sudo tee "$NGINX_SITE_CONF" > /dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    root $WEB_DIR;
    index index.html;

    # Static frontend assets
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # API reverse proxy to FastAPI backend
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable the site
sudo ln -sf "$NGINX_SITE_CONF" /etc/nginx/sites-enabled/

# Test Nginx syntax and reload
sudo nginx -t
sudo systemctl reload nginx

# 7. Attempt Automatic SSL Certificate via Let's Encrypt / Certbot
echo "Checking SSL certificate via Certbot for $DOMAIN..."
if sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --redirect -m surya76755416@gmail.com; then
    echo "✓ SSL certificate installed and auto-renewal configured!"
    PROTOCOL="https"
else
    echo "⚠ Note: Certbot did not complete SSL setup yet (ensure DNS A record '$DOMAIN -> 140.245.203.191' has propagated). Once DNS is active, run:"
    echo "  sudo certbot --nginx -d $DOMAIN"
    PROTOCOL="http"
fi

echo "=========================================================="
echo "🎉 SUBDOMAIN DEPLOYMENT READY!"
echo "=========================================================="
echo "🌐 Live Portal: $PROTOCOL://$DOMAIN/"
echo "⚡ Live API:    $PROTOCOL://$DOMAIN/api/health"
echo "=========================================================="
