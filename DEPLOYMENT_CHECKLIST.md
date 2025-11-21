# NeuroBridge 部署检查清单

## 部署前准备

### 1. 本地准备
- [ ] 确保所有代码已提交并测试通过
- [ ] 检查 `backend/.env.example` 文件是否包含所有必要的环境变量
- [ ] 确认 `docker-compose.prod.yml` 配置正确
- [ ] 确认 `nginx-server.conf` 域名配置正确

### 2. 服务器准备
- [ ] 服务器 IP: 82.157.123.207
- [ ] 域名 DNS 已指向服务器: neurobridge.ton-ton.fun
- [ ] SSH 访问正常: `ssh root@82.157.123.207`
- [ ] 服务器有足够的磁盘空间（至少 5GB）

### 3. API 密钥准备
- [ ] Wenxin (百度文心) API Key 和 Secret Key
- [ ] OpenAI API Key（可选）
- [ ] XAI API Key（可选）

## 快速部署步骤

### 方法 1: 使用自动化脚本（推荐）

在 Windows PowerShell 中执行：
```powershell
.\deploy.ps1
```

或在 Git Bash / Linux / macOS 中执行：
```bash
chmod +x deploy.sh
./deploy.sh
```

### 方法 2: 手动部署

#### 步骤 1: 创建部署包
```bash
tar -czf neurobridge-deploy.tar.gz \
  --exclude='node_modules' \
  --exclude='frontend/node_modules' \
  --exclude='backend/__pycache__' \
  --exclude='backend/venv' \
  --exclude='.git' \
  backend/ frontend/ docker-compose.prod.yml nginx-server.conf
```

#### 步骤 2: 上传到服务器
```bash
scp neurobridge-deploy.tar.gz root@82.157.123.207:/tmp/
```

#### 步骤 3: 连接到服务器
```bash
ssh root@82.157.123.207
```

#### 步骤 4: 在服务器上执行
```bash
# 创建目录
mkdir -p /opt/neurobridge
cd /opt/neurobridge

# 解压
tar -xzf /tmp/neurobridge-deploy.tar.gz

# 配置环境变量
nano backend/.env
```

添加以下内容到 `.env` 文件：
```env
WENXIN_API_KEY=your_key_here
WENXIN_SECRET_KEY=your_secret_here
OPENAI_API_KEY=your_key_here
XAI_API_KEY=your_key_here
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=false
```

#### 步骤 5: 配置 Nginx
```bash
# 复制配置
cp nginx-server.conf /etc/nginx/sites-available/neurobridge
ln -s /etc/nginx/sites-available/neurobridge /etc/nginx/sites-enabled/

# 测试配置
nginx -t

# 重启 Nginx
systemctl restart nginx
```

#### 步骤 6: 启动 Docker 容器
```bash
cd /opt/neurobridge
docker-compose -f docker-compose.prod.yml up -d --build
```

#### 步骤 7: 配置 SSL 证书
```bash
certbot --nginx -d neurobridge.ton-ton.fun
```

## 部署后验证

### 1. 检查容器状态
```bash
docker-compose -f /opt/neurobridge/docker-compose.prod.yml ps
```

应该看到两个容器都在运行：
- neurobridge-backend
- neurobridge-frontend

### 2. 检查后端健康
```bash
curl http://localhost:8000/api/v1/health
```

应该返回：`{"status":"healthy"}`

### 3. 检查前端
```bash
curl http://localhost:3000/health
```

应该返回：`healthy`

### 4. 检查 Nginx 代理
```bash
curl https://neurobridge.ton-ton.fun/api/v1/health
```

### 5. 浏览器测试
在浏览器中访问：
- https://neurobridge.ton-ton.fun

测试功能：
- [ ] 页面正常加载
- [ ] 可以选择角色（ASD/NT/Uncertain）
- [ ] 可以输入文本
- [ ] 翻译功能正常工作
- [ ] 情绪强度计显示正常
- [ ] 历史记录功能正常
- [ ] 隐私声明显示正常

### 6. 查看日志
```bash
# 查看所有日志
docker-compose -f /opt/neurobridge/docker-compose.prod.yml logs -f

# 只查看后端日志
docker-compose -f /opt/neurobridge/docker-compose.prod.yml logs -f backend

# 只查看前端日志
docker-compose -f /opt/neurobridge/docker-compose.prod.yml logs -f frontend

# 查看 Nginx 日志
tail -f /var/log/nginx/neurobridge-access.log
tail -f /var/log/nginx/neurobridge-error.log
```

## 常见问题排查

### 问题 1: 容器无法启动
```bash
# 查看详细日志
docker-compose -f /opt/neurobridge/docker-compose.prod.yml logs

# 检查端口占用
netstat -tulpn | grep -E '8000|3000|80|443'
```

### 问题 2: API 连接失败
- [ ] 检查 `.env` 文件是否配置正确
- [ ] 检查 API 密钥是否有效
- [ ] 查看后端日志是否有错误

### 问题 3: SSL 证书问题
```bash
# 检查证书状态
certbot certificates

# 手动续期
certbot renew

# 测试 Nginx 配置
nginx -t
```

### 问题 4: 前端无法连接后端
- [ ] 检查 Nginx 配置是否正确
- [ ] 检查后端容器是否运行
- [ ] 检查防火墙设置

## 维护命令

### 重启服务
```bash
docker-compose -f /opt/neurobridge/docker-compose.prod.yml restart
```

### 停止服务
```bash
docker-compose -f /opt/neurobridge/docker-compose.prod.yml down
```

### 更新应用
```bash
# 上传新的部署包
scp neurobridge-deploy.tar.gz root@82.157.123.207:/tmp/

# 在服务器上
cd /opt/neurobridge
tar -xzf /tmp/neurobridge-deploy.tar.gz
docker-compose -f docker-compose.prod.yml up -d --build
```

### 查看资源使用
```bash
docker stats
```

### 清理 Docker 资源
```bash
docker system prune -a
```

## 安全建议

### 1. 配置防火墙
```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### 2. 定期备份
```bash
# 备份配置
tar -czf neurobridge-backup-$(date +%Y%m%d).tar.gz \
  /opt/neurobridge/backend/.env \
  /etc/nginx/sites-available/neurobridge
```

### 3. 监控日志
定期检查日志文件，查找异常访问或错误。

## 联系信息

如有问题，请查看：
- 详细部署指南: `DEPLOYMENT_GUIDE.md`
- 项目文档: `README.md`
- 快速启动: `QUICK_START.md`
