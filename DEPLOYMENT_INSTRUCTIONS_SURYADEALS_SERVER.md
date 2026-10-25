# 🌐 Dedicated Subdomain Deployment Guide: `wind.suryadeals.com`

This guide explains how to deploy the **UK Energy Utility Wind Forecast & Accuracy Evaluation Portal** to its own dedicated subdomain:
👉 **`https://wind.suryadeals.com`**

Your main portfolio at `https://suryadeals.com` remains completely untouched and isolated.

---

## 📋 Step 1: Add DNS Record (Takes 1 Minute)

In your DNS manager (Cloudflare, GoDaddy, Namecheap, Hostinger, etc.):

Add a new **A Record**:
* **Type:** `A`
* **Name / Host:** `wind` (or `wind.suryadeals.com`)
* **IPv4 Address / Target:** `140.245.203.191`
* **TTL:** Auto (or 1 minute)
* *If using Cloudflare: You can set Proxy status to "DNS Only" (Grey Cloud) or "Proxied" (Orange Cloud).*

---

## ⚡ Step 2: Run Deployment on Server (Single Command)

### 1. SSH into your Oracle Cloud Server:
```bash
ssh -i <path-to-your-key.key> ubuntu@140.245.203.191
```

### 2. Run the automated deployment script:
Copy and paste this single command into your server terminal:
```bash
curl -sSL https://raw.githubusercontent.com/somanisuryateja/wind-kjhwr/main/deploy_server.sh | sudo bash
```

*(Note: If you want to use a different subdomain like `utility.suryadeals.com`, simply pass it as an argument: `curl -sSL ... | sudo bash -s utility.suryadeals.com`)*

---

## 🛠️ What the Automated Script Sets Up

```text
[ Browser: https://wind.suryadeals.com ]
                     │
                     ▼
           Oracle Cloud Server (140.245.203.191)
         Nginx Virtual Host (/etc/nginx/sites-available/wind.suryadeals.com)
                     │
       ┌─────────────┴─────────────┐
       │                           │
    location /                  location /api/
       │                           │
 Static Vite Bundle          FastAPI Uvicorn Backend
  (/var/www/wind/)           (Systemd Service on 127.0.0.1:8000)
```

1. **Clones Repository:** Clones/updates `wind-kjhwr` to `/opt/wind-app`.
2. **Builds Frontend:** Runs `npm install && npm run build` at root `/` and publishes to `/var/www/wind/`.
3. **Sets Up FastAPI Backend:** Installs Python virtual environment, dependencies, and creates/starts `wind-backend.service` on `127.0.0.1:8000`.
4. **Configures Dedicated Nginx Site:** Creates `/etc/nginx/sites-available/wind.suryadeals.com` with reverse proxy for `/api/`.
5. **Configures SSL Certificate:** Runs Certbot to automatically issue and install a free Let's Encrypt HTTPS certificate for `wind.suryadeals.com` with HTTP $\rightarrow$ HTTPS redirection.

---

## 🔄 Optional: Enable GitHub Actions Auto-Deploy (CI/CD)

Whenever you push to GitHub, it can automatically deploy to `wind.suryadeals.com`:

1. Open repository settings: [https://github.com/somanisuryateja/wind-kjhwr/settings/secrets/actions](https://github.com/somanisuryateja/wind-kjhwr/settings/secrets/actions)
2. Add the 3 secrets you already use for `suryadeals-new`:
   * `SERVER_HOST`: `140.245.203.191`
   * `SERVER_USER`: `ubuntu`
   * `SSH_PRIVATE_KEY`: `[Your Oracle Cloud SSH private key .key / .pem content]`

---

## ✅ How to Test & Verify

Once DNS has propagated and the script completes:

1. **Test Frontend:** Open [https://wind.suryadeals.com](https://wind.suryadeals.com) in your browser.
2. **Test API Health:** Open [https://wind.suryadeals.com/api/health](https://wind.suryadeals.com/api/health).
   Expected response:
   ```json
   {
     "status": "healthy",
     "service": "WindForecastEvaluationAPI",
     "version": "1.0.0",
     "market": "UK Wholesale Electricity (EPEX SPOT / Nord Pool UK)",
     "source": "Elexon BMRS Live Data Stream"
   }
   ```
3. **Confirm Portfolio Integrity:** Open [https://suryadeals.com](https://suryadeals.com) to confirm your main portfolio continues running normally.
