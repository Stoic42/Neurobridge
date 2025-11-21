# 🚀 立即部署 NeuroBridge

## 最快部署方式（3 步完成）

### 第 1 步：运行部署脚本

在项目根目录打开 PowerShell，执行：

```powershell
.\deploy.ps1
```

这个脚本会自动：
- ✅ 创建部署包
- ✅ 上传到服务器
- ✅ 安装 Docker 和 Nginx
- ✅ 配置并启动服务

### 第 2 步：配置 API 密钥

脚本运行完成后，连接到服务器配置 API 密钥：

```bash
ssh root@82.157.123.207
nano /opt/neurobridge/backend/.env
```

添加你的 API 密钥：
```env
QWEN_API_KEY=sk-your-qwen-key
XAI_API_KEY=xai-your-key
WENXIN_API_KEY=your-wenxin-key
WENXIN_SECRET_KEY=your-wenxin-secret
OPENAI_API_KEY=sk-your-openai-key
GEMINI_API_KEY=your-gemini-key

API_HOST=0.0.0.0
API_PORT=8000
DEBUG=false
```

保存后重启服务：
```bash
cd /opt/neurobridge
docker-compose -f docker-compose.prod.yml restart
```

### 第 3 步：配置 SSL 证书

```bash
certbot --nginx -d neurobridge.ton-ton.fun
```

按提示输入邮箱并同意条款即可。

## 完成！🎉

访问你的应用：**https://neurobridge.ton-ton.fun**

---

## 如果脚本失败，手动部署

### 1. 创建并上传部署包

```powershell
# 创建压缩包
tar -czf neurobridge-deploy.tar.gz --exclude='node_modules' --exclude='frontend/node_modules' --exclude='backend/__pycache__' --exclude='backend/venv' --exclude='.git' backend/ frontend/ docker-compose.prod.yml nginx-server.conf

# 上传
scp neurobridge-deploy.tar.gz root@82.157.123.207:/tmp/
```

### 2. 在服务器上部署

```bash
# 连接服务器
ssh root@82.157.123.207

# 安装依赖
apt update
apt install -y docker.io docker-compose nginx certbot python3-certbot-nginx

# 解压项目
mkdir -p /opt/neurobridge
cd /opt/neurobridge
tar -xzf /tmp/neurobridge-deploy.tar.gz

# 配置环境变量
nano backend/.env
# （添加上面的 API 密钥）

# 配置 Nginx
cp nginx-server.conf /etc/nginx/sites-available/neurobridge
ln -s /etc/nginx/sites-available/neurobridge /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# 启动服务
docker-compose -f docker-compose.prod.yml up -d --build

# 配置 SSL
certbot --nginx -d neurobridge.ton-ton.fun
```

---

## 验证部署

### 检查服务状态
```bash
docker-compose -f /opt/neurobridge/docker-compose.prod.yml ps
```

### 测试 API
```bash
curl http://localhost:8000/api/v1/health
curl https://neurobridge.ton-ton.fun/api/v1/health
```

### 查看日志
```bash
docker-compose -f /opt/neurobridge/docker-compose.prod.yml logs -f
```

---

## 常用管理命令

```bash
# 重启服务
docker-compose -f /opt/neurobridge/docker-compose.prod.yml restart

# 停止服务
docker-compose -f /opt/neurobridge/docker-compose.prod.yml down

# 查看日志
docker-compose -f /opt/neurobridge/docker-compose.prod.yml logs -f backend

# 更新应用（上传新包后）
cd /opt/neurobridge
tar -xzf /tmp/neurobridge-deploy.tar.gz
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## 需要帮助？

- 📖 详细指南：查看 `DEPLOYMENT_GUIDE.md`
- ✅ 检查清单：查看 `DEPLOYMENT_CHECKLIST.md`
- 📝 项目文档：查看 `README.md`

## 部署架构

```
Internet
    ↓
Nginx (443) → SSL 终止
    ↓
    ├─→ /api/* → Backend Container (8000)
    └─→ /* → Frontend Container (3000)
```

## 端口说明

- **80**: HTTP（自动重定向到 HTTPS）
- **443**: HTTPS（Nginx）
- **8000**: 后端 API（内部）
- **3000**: 前端应用（内部）

## 安全提示

✅ 已配置的安全措施：
- HTTPS 强制跳转
- 安全响应头
- CORS 配置
- 容器隔离

⚠️ 建议额外配置：
- 配置防火墙（UFW）
- 定期备份 `.env` 文件
- 监控日志文件
- 定期更新系统和 Docker 镜像
