---
inclusion: always
---

# NeuroBridge Deployment Configuration

## Production Deployment

**Live Site:** https://neurobridge.ton-ton.fun  
**Server:** root@82.157.123.207

## Port Configuration

**IMPORTANT:** The following ports are already in use by other services. Do NOT use them for NeuroBridge:

- Port 8000: Memory Gallery backend
- Port 8001: Memory Gallery backend (alternate)
- Port 8002: Vocabulary service backend
- Port 3000: Other Node service
- Port 3001: Memory Gallery frontend

**NeuroBridge Ports:**
- Backend: **8003**
- Frontend: **3002**

## Service Files

### Backend Service
- Location: `/etc/systemd/system/neurobridge-backend.service`
- Port: 8003
- Working Directory: `/opt/neurobridge/backend`
- Command: `python3 -m uvicorn main:app --host 0.0.0.0 --port 8003`

### Frontend Service
- Location: `/etc/systemd/system/neurobridge-frontend.service`
- Port: 3002
- Working Directory: `/opt/neurobridge/frontend`
- Command: `npx serve -s dist -l 3002`

### Nginx Configuration
- Location: `/etc/nginx/sites-available/neurobridge`
- Upstream backend: `localhost:8003`
- Upstream frontend: `localhost:3002`
- SSL: Enabled with Let's Encrypt certificate

## Frontend Build Configuration

**Critical:** The frontend must be built with the correct API URL for production.

### Production Environment File
File: `frontend/.env.production`
```
VITE_API_URL=
```

The empty value ensures the frontend uses relative paths (proxied through Nginx) instead of hardcoded localhost URLs.

### API Service Configuration
File: `frontend/src/services/api.ts`

The API_BASE_URL must check for `undefined` explicitly:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL !== undefined 
  ? import.meta.env.VITE_API_URL 
  : 'http://localhost:8000';
```

This ensures that when `VITE_API_URL` is set to an empty string in production, it uses relative paths instead of falling back to localhost.

## Deployment Commands

### Update Backend
```bash
scp -r backend/* root@82.157.123.207:/opt/neurobridge/backend/
ssh root@82.157.123.207 "systemctl restart neurobridge-backend"
```

### Update Frontend
```bash
scp -r frontend/src/* root@82.157.123.207:/opt/neurobridge/frontend/src/
scp frontend/.env.production root@82.157.123.207:/opt/neurobridge/frontend/
ssh root@82.157.123.207 "cd /opt/neurobridge/frontend && npm run build && systemctl restart neurobridge-frontend"
```

### Update Nginx Config
```bash
# Update local config first, then:
scp nginx-server-temp.conf root@82.157.123.207:/opt/neurobridge/
ssh root@82.157.123.207 "cp /opt/neurobridge/nginx-server-temp.conf /etc/nginx/sites-available/neurobridge && nginx -t && systemctl reload nginx"
```

## Service Management

### Check Status
```bash
ssh root@82.157.123.207 "systemctl status neurobridge-backend neurobridge-frontend"
```

### View Logs
```bash
# Backend
ssh root@82.157.123.207 "journalctl -u neurobridge-backend -f"

# Frontend
ssh root@82.157.123.207 "journalctl -u neurobridge-frontend -f"
```

### Restart Services
```bash
ssh root@82.157.123.207 "systemctl restart neurobridge-backend neurobridge-frontend"
```

## SSL Certificate

- Provider: Let's Encrypt
- Domain: neurobridge.ton-ton.fun
- Auto-renewal: Enabled via certbot timer
- Certificate path: `/etc/letsencrypt/live/neurobridge.ton-ton.fun/`

### Renew Certificate
```bash
ssh root@82.157.123.207 "certbot renew --force-renewal && systemctl reload nginx"
```

## Troubleshooting

### Frontend shows "localhost:8000" errors
- Check that `.env.production` exists with `VITE_API_URL=`
- Rebuild frontend: `cd /opt/neurobridge/frontend && npm run build`
- Restart frontend service: `systemctl restart neurobridge-frontend`

### Backend not responding
- Check if port 8003 is in use: `lsof -i :8003`
- Check backend logs: `journalctl -u neurobridge-backend -n 50`
- Verify .env file exists: `ls -la /opt/neurobridge/backend/.env`

### Wrong service showing on neurobridge.ton-ton.fun
- Verify Nginx upstream ports: `grep -A 2 'upstream' /etc/nginx/sites-available/neurobridge`
- Should show `localhost:8003` for backend and `localhost:3002` for frontend
- Reload Nginx: `systemctl reload nginx`

## Important Notes

1. **Never use ports 8000, 8001, 8002, 3000, 3001** - they are reserved for other services
2. **Always build frontend with `.env.production`** before deploying
3. **Check that services are running on correct ports** before updating Nginx
4. **Test locally first** with `npm run dev` and `uvicorn main:app --reload`
