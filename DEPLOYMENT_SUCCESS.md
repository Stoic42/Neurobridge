# NeuroBridge Deployment Success

## Deployment Details

**Domain:** https://neurobridge.ton-ton.fun  
**Date:** November 17, 2025  
**Method:** Direct deployment (non-Docker due to registry timeout)  
**SSL:** ✅ Let's Encrypt certificate (expires Feb 15, 2026)

## Services Running

### Backend API
- **Service:** neurobridge-backend.service
- **Port:** 8001
- **Status:** ✅ Running
- **Command:** `systemctl status neurobridge-backend`
- **Logs:** `journalctl -u neurobridge-backend -f`

### Frontend
- **Service:** neurobridge-frontend.service  
- **Port:** 3001
- **Status:** ✅ Running
- **Command:** `systemctl status neurobridge-frontend`
- **Logs:** `journalctl -u neurobridge-frontend -f`

### Nginx Reverse Proxy
- **Config:** /etc/nginx/sites-available/neurobridge
- **Status:** ✅ Running with SSL/TLS (HTTPS)
- **SSL Certificate:** Let's Encrypt (auto-renews)
- **Command:** `systemctl status nginx`

## API Endpoints

Base URL: https://neurobridge.ton-ton.fun  
(HTTP automatically redirects to HTTPS)

- `GET /` - API status
- `POST /api/v1/translate` - Translation endpoint
- `POST /api/v1/tone-adjust` - Tone adjustment endpoint
- `GET /api/v1/health` - Health check
- `GET /api/v1/status` - Status check

## SSL Certificate Details

- **Provider:** Let's Encrypt
- **Domain:** neurobridge.ton-ton.fun
- **Expiry:** February 15, 2026 (89 days)
- **Auto-renewal:** ✅ Enabled (certbot timer)
- **Certificate Path:** /etc/letsencrypt/live/neurobridge.ton-ton.fun/fullchain.pem
- **Private Key Path:** /etc/letsencrypt/live/neurobridge.ton-ton.fun/privkey.pem

Check certificate status:
```bash
ssh root@82.157.123.207 "certbot certificates"
```

Test auto-renewal:
```bash
ssh root@82.157.123.207 "certbot renew --dry-run"
```

## Next Steps (Optional)

### 1. Monitor Services

```bash
# Check all services
ssh root@82.157.123.207 "systemctl status neurobridge-backend neurobridge-frontend nginx"

# View logs
ssh root@82.157.123.207 "journalctl -u neurobridge-backend -u neurobridge-frontend -f"
```

### 2. Update Deployment

```bash
# Backend update
scp -r backend/* root@82.157.123.207:/opt/neurobridge/backend/
ssh root@82.157.123.207 "systemctl restart neurobridge-backend"

# Frontend update
scp -r frontend/* root@82.157.123.207:/opt/neurobridge/frontend/
ssh root@82.157.123.207 "cd /opt/neurobridge/frontend && npm run build && systemctl restart neurobridge-frontend"
```

## Troubleshooting

### Backend not responding
```bash
ssh root@82.157.123.207 "journalctl -u neurobridge-backend -n 100"
ssh root@82.157.123.207 "systemctl restart neurobridge-backend"
```

### Frontend not loading
```bash
ssh root@82.157.123.207 "journalctl -u neurobridge-frontend -n 100"
ssh root@82.157.123.207 "systemctl restart neurobridge-frontend"
```

### Nginx issues
```bash
ssh root@82.157.123.207 "nginx -t"
ssh root@82.157.123.207 "systemctl reload nginx"
```

## Files Deployed

- `/opt/neurobridge/backend/` - Backend application
- `/opt/neurobridge/frontend/` - Frontend application  
- `/etc/systemd/system/neurobridge-backend.service` - Backend service
- `/etc/systemd/system/neurobridge-frontend.service` - Frontend service
- `/etc/nginx/sites-available/neurobridge` - Nginx configuration
