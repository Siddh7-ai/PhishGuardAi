# PhishGuard AI - Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Production Deployment](#production-deployment)
4. [Database Setup](#database-setup)
5. [Environment Variables](#environment-variables)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Python 3.8 or higher
- pip or pip3
- Git
- For production: Heroku CLI / Docker / AWS / Your chosen cloud platform

---

## Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/phishguard-ai.git
cd phishguard-ai
```

### 2. Create a Python virtual environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install dependencies
```bash
# Core dependencies
pip install -r requirements.txt

# Development dependencies (optional)
pip install -r requirements-dev.txt
```

### 4. Setup environment variables
```bash
# Copy the example file
cp .env.example .env

# Edit .env with your development settings (defaults are fine for local development)
# For Windows with PowerShell:
Copy-Item .env.example .env
```

### 5. Initialize the database
```bash
cd backend
python -c "from database import init_db; init_db()"
cd ..
```

### 6. Train/load the model
The project expects a pre-trained model at `model/phishing_model.pkl`. If it doesn't exist:

```bash
# To train a new model (requires sample data in data/sample_urls.csv)
cd ai
python train_model.py
cd ..
```

### 7. Start the backend server
```bash
cd backend
python app.py
```

The server will start at `http://localhost:5000`

### 8. Open the frontend
Access the web dashboard at:
- `http://localhost:5000` (if serving from Flask)
- Or open `frontend/index.html` in your browser

### 9. Load the browser extension (development)
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `extension/` folder

---

## Production Deployment

### Option 1: Heroku Deployment

#### Prerequisites:
- Heroku CLI installed
- Heroku account

#### Steps:
```bash
# 1. Login to Heroku
heroku login

# 2. Create a new Heroku app
heroku create phishguard-ai

# 3. Set environment variables
heroku config:set SECRET_KEY=$(python -c "import secrets; print(secrets.token_urlsafe(32))")
heroku config:set JWT_SECRET_KEY=$(python -c "import secrets; print(secrets.token_urlsafe(32))")
heroku config:set FLASK_ENV=production
heroku config:set CORS_ORIGINS=https://yourdomain.com

# 4. Deploy
git push heroku main

# 5. Initialize database
heroku run "cd backend && python -c 'from database import init_db; init_db()'"
```

### Option 2: Docker Deployment

#### Create Dockerfile:
```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV FLASK_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:${PORT}", "backend.app:app"]
```

#### Build and run:
```bash
docker build -t phishguard-ai .
docker run -p 5000:5000 -e SECRET_KEY=your-secret-key phishguard-ai
```

### Option 3: AWS/DigitalOcean/Other Cloud

#### General Steps:
1. Provision a server (Ubuntu 20.04 recommended)
2. SSH into the server
3. Install Python 3.8+ and pip
4. Clone the repository
5. Create virtual environment and install dependencies
6. Set environment variables
7. Use systemd service file to manage the app
8. Use Nginx/Apache as reverse proxy
9. Set up SSL with Let's Encrypt

#### Sample systemd service file (phishguard-ai.service):
```ini
[Unit]
Description=PhishGuard AI Flask Application
After=network.target

[Service]
User=www-data
WorkingDirectory=/home/phishguard/app
Environment="PATH=/home/phishguard/app/venv/bin"
Environment="SECRET_KEY=your-secret-key"
Environment="JWT_SECRET_KEY=your-jwt-secret"
Environment="FLASK_ENV=production"
ExecStart=/home/phishguard/app/venv/bin/gunicorn --workers 4 --bind 127.0.0.1:5000 backend.app:app
Restart=always

[Install]
WantedBy=multi-user.target
```

---

## Database Setup

### SQLite (Default - Development/Small-scale)
- Automatically created at `backend/phishguard.db`
- Initialized on first app run

### PostgreSQL (Production Recommended)

#### Install PostgreSQL:
```bash
# Ubuntu
sudo apt-get install postgresql postgresql-contrib

# macOS
brew install postgresql
```

#### Create database:
```bash
createdb phishguard_ai
psql phishguard_ai -U postgres
```

#### Update connections in code:
```python
# Modify database.py to use PostgreSQL
# Example with SQLAlchemy:
DATABASE_URL = "postgresql://user:password@localhost:5432/phishguard_ai"
```

---

## Environment Variables

### Required for Production:
```bash
# Security
SECRET_KEY=<generate-with-secrets-module>
JWT_SECRET_KEY=<generate-with-secrets-module>
FLASK_ENV=production

# Database
DATABASE_PATH=phishguard.db

# CORS
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Server
PORT=5000
```

### Generate Secure Keys:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## Performance Optimization

### 1. Enable caching
```python
# In app.py
from flask_caching import Cache
cache = Cache(app, config={'CACHE_TYPE': 'simple'})
```

### 2. Use CDN for static files
- Deploy frontend to CloudFront / Cloudflare
- Serve JS/CSS from a CDN URL

### 3. Database optimization
- Add indexes for frequently queried columns
- Use connection pooling for PostgreSQL

### 4. Model optimization
- Consider quantization of ML model
- Use ONNX format for faster inference

---

## SSL/HTTPS Setup

### Using Let's Encrypt with Nginx:
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Nginx configuration:
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## Monitoring & Logging

### Application Logs:
```bash
# Heroku
heroku logs --tail

# Systemd
sudo journalctl -u phishguard-ai -f

# Docker
docker logs -f <container-id>
```

### Performance Monitoring:
- Use New Relic / DataDog for APM
- Enable application metrics collection
- Monitor API response times

---

## Troubleshooting

### Issue: Module import errors
**Solution:**
```bash
# Reinstall dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

### Issue: Database locked
**Solution:**
```bash
# Remove lock file
rm backend/phishguard.db-journal
```

### Issue: Port already in use
**Solution:**
```bash
# macOS/Linux: Find process on port 5000
lsof -i :5000

# Kill process
kill -9 <PID>

# Windows: Find process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Issue: CORS errors
**Solution:**
- Check `CORS_ORIGINS` environment variable
- Ensure frontend URL matches allowed origins
- Example: `CORS_ORIGINS=https://yourdomain.com,http://localhost:5000`

### Issue: SSL certificate errors
**Solution:**
- Verify certificate installation
- Check certificate expiration: `openssl x509 -enddate -noout -in /path/to/cert.pem`
- Renew certificate: `certbot renew`

---

## Security Checklist

- [ ] Change all default secret keys
- [ ] Set `FLASK_ENV=production`
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable login attempt lockout (see database.py)
- [ ] Use strong password requirements
- [ ] Regular security updates: `pip list --outdated`
- [ ] Database backups automated
- [ ] Monitor logs for suspicious activity

---

## Maintenance

### Regular Tasks:
1. **Weekly:** Check logs for errors
2. **Monthly:** Update dependencies: `pip install --upgrade -r requirements.txt`
3. **Quarterly:** Review security updates
4. **Annually:** Retrain ML model with new data

### Database Maintenance:
```bash
# PostgreSQL backup
pg_dump phishguard_ai > backup.sql

# PostgreSQL restore
psql phishguard_ai < backup.sql
```

---

## Support

For issues, please:
1. Check logs for error messages
2. Review this deployment guide
3. Visit: https://github.com/yourusername/phishguard-ai/issues
4. Contact: support@phishguard.example.com

---

**Last Updated:** February 2026
**Version:** 6.1.3
