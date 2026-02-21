# PhishGuard AI - Quick Reference Guide

**Version:** 6.1.3  
**Quick Links:** [Full Deployment Guide](DEPLOYMENT.md) | [Bug Fixes](BUG_FIXES.md) | [Status](DEPLOYMENT_READY.md)

---

## 🚀 Quick Start (Choose Your Path)

### Path 1: Docker (Recommended for Production)
```bash
docker build -t phishguard-ai .
docker run -p 5000:5000 -e SECRET_KEY=your-key phishguard-ai
# Access at http://localhost:5000
```

### Path 2: Local Development
```bash
python setup.py && cd backend && python app.py
# Access at http://localhost:5000
```

### Path 3: Heroku
```bash
git push heroku main
# Access at https://your-app.herokuapp.com
```

### Path 4: Traditional VPS
```bash
pip install -r requirements.txt
gunicorn --workers 4 backend.app:app
```

---

## 🔧 Essential Configuration

### Generate Security Keys:
```bash
python -c "import secrets; print('SECRET_KEY=' + secrets.token_urlsafe(32))"
python -c "import secrets; print('JWT_SECRET_KEY=' + secrets.token_urlsafe(32))"
```

### Set Environment Variables:
```bash
export FLASK_ENV=production
export SECRET_KEY=<generated-key>
export JWT_SECRET_KEY=<generated-key>
export CORS_ORIGINS=https://yourdomain.com
```

### Deploy Variables (Quick Checklist):
```
✅ FLASK_ENV=production
✅ SECRET_KEY=<strong-random-string>
✅ JWT_SECRET_KEY=<strong-random-string>
✅ CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
✅ DATABASE_PATH=phishguard.db
✅ PORT=5000
```

---

## 📊 Testing API Endpoints

### Health Check:
```bash
curl http://localhost:5000/health
```

### Public URL Scan:
```bash
curl -X POST http://localhost:5000/api/scan \
  -H "Content-Type: application/json" \
  -d '{"url": "http://example.com"}'
```

### Register User:
```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "SecurePass@123"
  }'
```

### Get Auth Token:
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass@123"
  }'
# Response includes: {"token": "eyJ..."}
```

### Authenticated Scan:
```bash
curl -X POST http://localhost:5000/api/predict-authenticated \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"url": "http://example.com"}'
```

### Scan History:
```bash
curl -X GET http://localhost:5000/api/history?limit=10 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### User Stats:
```bash
curl -X GET http://localhost:5000/api/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🗄️ Database Operations

### Initialize Database:
```bash
cd backend
python -c "from database import init_db; init_db()"
```

### Reset Database:
```bash
rm backend/phishguard.db          # Delete SQLite file
cd backend && python -c "from database import init_db; init_db()"
```

### PostgreSQL Connection:
```bash
# Development
export DATABASE_URL="postgresql://user:password@localhost:5432/phishguard_ai"

# Production
export DATABASE_URL="postgresql://prod_user:prod_password@prod-db.example.com:5432/phishguard_ai"
```

### Backup Database:
```bash
cp backend/phishguard.db backend/phishguard.db.backup-$(date +%Y%m%d)
```

---

## 🤖 Model Operations

### Check if Model Exists:
```bash
ls -la model/phishing_model.pkl
```

### Train New Model (if data available):
```bash
cd ai
python train_model.py
# Requires: data/sample_urls.csv with 'url' and 'label' columns
```

### Verify Model Loading:
```bash
python -c "import joblib; model = joblib.load('model/phishing_model.pkl'); print('✅ Model loaded successfully')"
```

---

## 📋 Common Problems & Fixes

### Problem: ModuleNotFoundError
```bash
# Solution: Reinstall dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

### Problem: Port already in use
```bash
# macOS/Linux: Find and kill process on port 5000
lsof -i :5000
kill -9 <PID>

# Windows: Find and kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Problem: Database locked
```bash
# Solution: Remove lock file
rm backend/phishguard.db-journal
```

### Problem: CORS errors
```bash
# Solution: Update CORS_ORIGINS
export CORS_ORIGINS=http://localhost:3000,http://localhost:8080
```

### Problem: Password verification fails
```bash
# Solution: Ensure bcrypt is installed correctly
pip install --upgrade bcrypt
```

### Problem: JWT token expired
```bash
# Solution: Get new token by logging in again or set JWT_EXPIRATION_HOURS=24
```

---

## 🔐 Security Quick Checks

### Verify HTTPS in Production:
```bash
curl -I https://yourdomain.com  # Should show secure headers
```

### Test Rate Limiting:
```bash
# Rapidly make requests (should get 429 Too Many Requests after limit)
for i in {1..101}; do curl -X GET http://localhost:5000/health; done
```

### Check for Exposed Secrets:
```bash
# Ensure no secrets in .env file that are committed
git log --all -S "SECRET_KEY" --pretty=format:"%h %s" # Should return nothing
```

### Verify SSL Certificate:
```bash
openssl s_client -connect yourdomain.com:443
```

---

## 📈 Monitoring Commands

### Check Application Logs:
```bash
# Docker
docker logs -f <container-id>

# Systemd
sudo journalctl -u phishguard-ai -f

# Heroku
heroku logs --tail

# File-based
tail -f logs/scan_history.csv
```

### Monitor Resource Usage:
```bash
# Docker
docker stats

# System (Linux)
top
# or
htop
# or
ps aux | grep python

# Docker Compose
docker-compose stats
```

### Check API Health:
```bash
watch -n 1 'curl -s http://localhost:5000/health | json_pp'
```

---

## 🚢 Deployment Checklist

```
Pre-Deployment:
☑ Generate SECRET_KEY
☑ Generate JWT_SECRET_KEY
☑ Set FLASK_ENV=production
☑ Update CORS_ORIGINS
☑ Setup HTTPS/SSL
☑ Initialize database
☑ Verify model loads
☑ Test all endpoints
☑ Setup backups
☑ Configure logging

Post-Deployment:
☑ Verify health endpoint
☑ Test authentication flow
☑ Test URL scanning
☑ Monitor error logs
☑ Check response times
☑ Verify HTTPS working
☑ Test rate limiting
☑ Monitor system resources
☑ Setup alerts
☑ Document endpoint URLs
```

---

## 🐛 Debug Mode (Development Only)

### Enable Debug Logging:
```bash
export FLASK_DEBUG=1
export FLASK_ENV=development
python app.py  # Auto-reloads on code changes
```

### Test Database Directly:
```bash
python -c "
from backend.database import User, ScanHistory
# Test user creation
user = User.create('testuser', 'test@example.com', 'Test@1234')
print('User created:', user)
"
```

### Test ML Model:
```bash
python -c "
import joblib
from ai.features import extract_features
model = joblib.load('model/phishing_model.pkl')
features = extract_features('http://example.com')
prediction = model.predict([features])[0]
print('Prediction:', prediction)
"
```

---

## 📱 Extension Testing

### Load Extension in Chrome:
1. Open `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select `extension/` folder

### Test Extension:
1. View popup: Click extension icon
2. Scan current page: Click "Scan" button
3. View results: Should show classification

### Debug Extension:
1. Open DevTools: Right-click > Inspect
2. Go to "Service Worker" tab
3. Check console for logs
4. Monitor network requests

---

## 📚 Documentation Quick Links

| Document | Purpose |
|----------|---------|
| [DEPLOYMENT_READY.md](DEPLOYMENT_READY.md) | Final deployment status & checklist |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Comprehensive deployment guide (7 sections) |
| [BUG_FIXES.md](BUG_FIXES.md) | Technical details of all fixes |
| [README.md](README.md) | Project overview |
| [This File](QUICK_REFERENCE.md) | Quick commands & troubleshooting |

---

## 🔗 Useful Links

- **API Base URL:** http://localhost:5000 (development)
- **Health Check:** http://localhost:5000/health
- **Web Dashboard:** http://localhost:5000/frontend (if configured)
- **PyPI Packages:** https://pypi.org
- **Flask Docs:** https://flask.palletsprojects.com
- **Heroku Deploy:** https://devcenter.heroku.com
- **Docker Hub:** https://hub.docker.com

---

## 📞 Need Help?

1. **Check Documentation:**
   - DEPLOYMENT.md for detailed setup
   - BUG_FIXES.md for technical issues
   - README.md for overview

2. **Check Logs:**
   - Application logs show detailed errors
   - Database operations logged
   - API requests/responses tracked

3. **Common Commands:**
   - `python setup.py` - Interactive setup
   - `python -m pytest` - Run tests
   - `python -m flake8 backend/` - Code quality

---

**Version:** v6.1.3  
**Status:** ✅ Production Ready  
**Last Updated:** February 21, 2026  

🚀 **GOOD LUCK WITH YOUR DEPLOYMENT!** 🚀
