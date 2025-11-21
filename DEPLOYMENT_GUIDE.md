# NeuroBridge 部署指南

## 服务器信息
- **服务器IP**: 82.157.123.207
- **域名**: neurobridge.ton-ton.fun
- **部署方式**: Docker Compose + Nginx

## 部署步骤

### 1. 服务器准备

首先连接到服务器：
```bash
ssh root@82.157.123.207
```

安装必要的软件：
```bash
# 更新系统
apt update && apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 安装 Docker Compose
apt install docker-compose -y

# 安装 Nginx
apt install nginx -y

# 安装 Certbot (用于 SSL 证书)
apt install certbot python3-certbot-nginx -y
```

### 2. 上传项目文件

在本地项目根目录执行：
```bash
# 创建部署压缩包（排除不必要的文件）
tar -czf neurobridge-deploy.tar.gz \
  --exclude='node_modules' \
  --exclude='frontend/node_modules' \
  --exclude='backend/__pycache__' \
  --exclude='backend/venv' \
  --exclude='.git' \
  --exclude='*.pyc' \
  backend/ frontend/ docker-compose.prod.yml nginx-server.conf

# 上传到服务器
scp neurobridge-deploy.tar.gz root@82.157.123.207:/opt/

# 清理本地临时文件
rm neurobridge-deploy.tar.gz
```

### 3. 服务器端解压和配置

在服务器上执行：
```bash
# 创建项目目录
mkdir -p /opt/neurobridge
cd /opt/neurobridge

# 解压文件
tar -xzf /opt/neurobridge-deploy.tar.gz -C /opt/neurobridge/

# 配置后端环境变量
cd /opt/neurobridge
nano backend/.env
```

在 `.env` 文件中添加你的 API 密钥：
```env
# LLM API Keys
WENXIN_API_KEY=your_wenxin_api_key_here
WENXIN_SECRET_KEY=your_wenxin_secret_key_here
OPENAI_API_KEY=your_openai_api_key_here
XAI_API_KEY=your_xai_api_key_here

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=false
```

### 4. 配置前端 API 地址

更新前端配置以使用生产环境 API：
```bash
# 创建前端环境配置
cat > /opt/neurobridge/frontend/.env.production << 'EOF'
VITE_API_BASE_URL=https://neurobridge.ton-ton.fun/api
EOF
```

### 5. 配置 Nginx

```bash
# 复制 Nginx 配置
cp /opt/neurobridge/nginx-server.conf /etc/nginx/sites-available/neurobridge

# 创建软链接
ln -s /etc/nginx/sites-available/neurobridge /etc/nginx/sites-enabled/

# 测试配置
nginx -t

# 如果测试通过，重启 Nginx
systemctl restart nginx
```

### 6. 获取 SSL 证书

```bash
# 使用 Certbot 自动获取和配置 SSL 证书
certbot --nginx -d neurobridge.ton-ton.fun

# 设置自动续期
certbot renew --dry-run
```

### 7. 构建和启动 Docker 容器

```bash
cd /opt/neurobridge

# 构建并启动容器
docker-compose -f docker-compose.prod.yml up -d --build

# 查看容器状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f
```

### 8. 验证部署

```bash
# 检查后端健康状态
curl http://localhost:8000/api/v1/health

# 检查前端
curl http://localhost:3000/health

# 检查 Nginx 代理
curl https://neurobridge.ton-ton.fun/api/v1/health
```

在浏览器中访问：
- https://neurobridge.ton-ton.fun

## 常用管理命令

### 查看日志
```bash
# 查看所有容器日志
docker-compose -f docker-compose.prod.yml logs -f

# 只查看后端日志
docker-compose -f docker-compose.prod.yml logs -f backend

# 只查看前端日志
docker-compose -f docker-compose.prod.yml logs -f frontend
```

### 重启服务
```bash
# 重启所有服务
docker-compose -f docker-compose.prod.yml restart

# 只重启后端
docker-compose -f docker-compose.prod.yml restart backend

# 只重启前端
docker-compose -f docker-compose.prod.yml restart frontend
```

### 更新应用
```bash
cd /opt/neurobridge

# 拉取最新代码（如果使用 git）
git pull

# 重新构建并启动
docker-compose -f docker-compose.prod.yml up -d --build
```

### 停止服务
```bash
docker-compose -f docker-compose.prod.yml down
```

### 完全清理（包括数据卷）
```bash
docker-compose -f docker-compose.prod.yml down -v
```

## 监控和维护

### 检查磁盘空间
```bash
df -h
```

### 清理 Docker 资源
```bash
# 清理未使用的镜像
docker image prune -a

# 清理未使用的容器
docker container prune

# 清理所有未使用的资源
docker system prune -a
```

### 查看资源使用
```bash
docker stats
```

## 故障排查

### 容器无法启动
```bash
# 查看详细日志
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend

# 检查端口占用
netstat -tulpn | grep -E '8000|3000|80|443'
```

### SSL 证书问题
```bash
# 检查证书状态
certbot certificates

# 手动续期
certbot renew
```

### Nginx 配置问题
```bash
# 测试配置
nginx -t

# 查看错误日志
tail -f /var/log/nginx/neurobridge-error.log
```

## 安全建议

1. **防火墙配置**：
```bash
# 安装 UFW
apt install ufw

# 允许必要端口
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS

# 启用防火墙
ufw enable
```

2. **定期更新**：
```bash
# 系统更新
apt update && apt upgrade -y

# Docker 镜像更新
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

3. **备份**：
```bash
# 备份配置和数据
tar -czf neurobridge-backup-$(date +%Y%m%d).tar.gz \
  /opt/neurobridge/backend/.env \
  /etc/nginx/sites-available/neurobridge
```

## 性能优化

### Nginx 缓存配置
可以在 Nginx 配置中添加缓存以提高性能：
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=neurobridge_cache:10m max_size=1g inactive=60m;
```

### Docker 资源限制
在 `docker-compose.prod.yml` 中添加资源限制：
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
```

## 联系支持

如果遇到问题，请检查：
1. Docker 容器日志
2. Nginx 错误日志
3. 系统资源使用情况
4. 网络连接状态
