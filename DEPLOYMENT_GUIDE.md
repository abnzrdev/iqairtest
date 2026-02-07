# 🚀 Deployment Guide: Local to Cloud Server

## Current Status
✅ **Local testing complete** - Everything works on your Linux machine

---

## Phase 1: Deploy Backend to Cloud Server

### Step 1: Choose Your Cloud Platform
- **AWS** (EC2, recommended)
- **DigitalOcean** (simpler, cheaper)
- **Linode** (good middle ground)
- **Google Cloud / Azure** (enterprise)

### Step 2: Set Up Cloud Server

Example for DigitalOcean/AWS:

```bash
# Create Linux droplet/instance (Ubuntu 20.04 or 22.04)
# SSH into it

# Install Python and dependencies
sudo apt update
sudo apt install python3 python3-pip git

# Clone your repo
git clone https://github.com/YOUR_REPO/iqairtest.git
cd iqairtest

# Install backend dependencies
cd backend
pip install -r requirements.txt

# Set environment variables
export SECRET_KEY="your-strong-secret-key"
export ADMIN_SECRET="your-admin-secret"
export MONGO_URL="mongodb://your-mongo-server:27017"  # or MongoDB Atlas
export DATABASE_NAME="breez"

# Start backend
python main.py
```

### Step 3: Use a Process Manager (Systemd Service)

Create `/etc/systemd/system/breez-backend.service`:

```ini
[Unit]
Description=Breez AI Backend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/iqairtest/backend
Environment="SECRET_KEY=your-strong-secret-key"
Environment="ADMIN_SECRET=your-admin-secret"
Environment="MONGO_URL=mongodb://localhost:27017"
Environment="DATABASE_NAME=breez"
ExecStart=/usr/bin/python3 /home/ubuntu/iqairtest/backend/main.py
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl enable breez-backend
sudo systemctl start breez-backend
sudo systemctl status breez-backend  # Check if running
```

### Step 4: Set Up Reverse Proxy (Nginx)

Create `/etc/nginx/sites-available/breez`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8003;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable it:
```bash
sudo ln -s /etc/nginx/sites-available/breez /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 5: SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Phase 2: Deploy Frontend to Cloud

### Option A: Deploy on Same Server as Backend

```bash
cd /home/ubuntu/iqairtest/frontend
npm install
npm run build
npm start  # or use PM2
```

Update `frontend/.env.production`:
```
NEXT_PUBLIC_API_URL=https://your-domain.com
```

### Option B: Deploy on Separate Server (Recommended)

Works the same way, but on a different VM.

---

## Phase 3: Set Up MongoDB (If Not Using MongoDB Atlas)

```bash
# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Create database and user
mongosh
use breez
db.createUser({
  user: "breez_user",
  pwd: "secure_password",
  roles: [{ role: "readWrite", db: "breez" }]
})
```

Update backend `.env`:
```
MONGO_URL=mongodb://breez_user:secure_password@localhost:27017/breez
```

---

## Phase 4: Generate Device Token on Cloud Server

SSH into your cloud server:

```bash
# Get admin token
ADMIN_TOKEN=$(curl -s -X POST http://localhost:8003/admin/login \
  -H 'Content-Type: application/json' \
  -d '{"secret":"your-admin-secret"}' | jq -r '.access_token')

# Get device token for Pi
DEVICE_TOKEN=$(curl -s -X POST http://localhost:8003/device/token \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com"}' | jq -r '.access_token')

echo "Device Token: $DEVICE_TOKEN"
```

---

## Phase 5: Configure Raspberry Pi to Connect to Cloud

On your Raspberry Pi, update `send.py`:

```python
# Change this:
API_URL = "http://89.218.178.215:8087/data"

# To this:
API_URL = "http://your-cloud-domain.com/data"
# Or
API_URL = "http://your-cloud-server-ip:8003/data"
```

Then run:
```bash
export DEVICE_TOKEN="<token-from-cloud-server>"
python send.py
```

---

## Checklist: Before Going Live

- [ ] Backend running on cloud server
- [ ] Database (MongoDB) configured and running
- [ ] Frontend deployed and accessible
- [ ] SSL certificate installed
- [ ] Environment variables set correctly
- [ ] Systemd services auto-start on reboot
- [ ] Logs configured for monitoring
- [ ] Backup strategy in place
- [ ] Firewall rules configured (allow ports 80, 443, close 8003 to public)

---

## Quick Deployment Script

Save as `deploy_to_cloud.sh`:

```bash
#!/bin/bash

CLOUD_SERVER="ubuntu@your-cloud-ip"
REPO_URL="https://github.com/YOUR_REPO/iqairtest.git"

ssh $CLOUD_SERVER << 'EOF'
  cd /home/ubuntu

  # Pull latest code
  if [ -d iqairtest ]; then
    cd iqairtest
    git pull
  else
    git clone $REPO_URL
    cd iqairtest
  fi

  # Install dependencies
  pip install -q -r backend/requirements.txt

  # Restart backend service
  sudo systemctl restart breez-backend

  # Check status
  sudo systemctl status breez-backend
EOF

echo "✅ Deployment complete!"
```

---

## Testing on Cloud

```bash
# Test backend
curl -H "Content-Type: application/json" \
  -d '{"secret":"your-admin-secret"}' \
  https://your-domain.com/admin/login

# Test from Pi
export DEVICE_TOKEN="your-token"
python send.py

# Check logs on cloud server
ssh ubuntu@your-cloud-ip
sudo journalctl -u breez-backend -f
```

---

## Monitoring & Logs

View backend logs:
```bash
sudo journalctl -u breez-backend -f  # Live logs
sudo journalctl -u breez-backend -n 50  # Last 50 lines
```

Monitor with:
- **Sentry** (error tracking)
- **ELK Stack** (centralized logging)
- **Datadog** (APM & monitoring)

---

## Cost Estimate

| Service | Monthly Cost |
|---------|-------------|
| DigitalOcean Droplet (2GB RAM) | $12 |
| DigitalOcean MongoDB | $15+ |
| Domain name | $12 |
| SSL (Let's Encrypt) | FREE |
| **Total** | **~$40/month** |

Or use **MongoDB Atlas** free tier (512MB storage) to reduce costs.

---

## Next Steps

1. Create cloud server
2. SSH into it
3. Run backend deployment steps
4. Generate device token
5. Deploy frontend
6. Configure Pi to connect to cloud
7. Monitor logs and test end-to-end

Need help with any specific step?
