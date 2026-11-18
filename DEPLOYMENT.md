# NeuroBridge 部署指南

> 唯一部署文档。原先的 `DEPLOYMENT_CHECKLIST.md` / `DEPLOYMENT_COMPLETE.md` /
> `DEPLOYMENT_GUIDE.md` / `DEPLOYMENT_SUCCESS.md` / `DEPLOY_NOW.md` /
> `FINAL_DEPLOYMENT_STATUS.md` / `PORT_CONFLICT_RESOLVED.md` / `PROJECT_STATUS.md`
> / `QUICK_START.md` / `SSL_SETUP_COMPLETE.md` 已合并至此，历史状态不再单独维护。

---

## 生产环境事实（2026-11-19 核实）

| 项 | 值 |
|---|---|
| 域名 | `neurobridge.ton-ton.fun` |
| 服务器 | `82.157.123.207`（SSH alias `ton-ton`，用户 `ubuntu`，需 `sudo`） |
| 后端代码 | `/opt/neurobridge/backend` |
| 前端代码 | `/opt/neurobridge/frontend` |
| 生产数据库 | 无（后端不持久化用户数据；历史只存浏览器 localStorage） |
| 证书 | `/etc/letsencrypt/live/neurobridge.ton-ton.fun/` |

### 进程与端口

| 服务 | systemd unit | 监听 | 启动命令 |
|---|---|---|---|
| 后端 | `neurobridge-backend.service` | `0.0.0.0:8003` | `uvicorn main:app --host 0.0.0.0 --port 8003` |
| 前端 | `neurobridge-frontend.service` | `127.0.0.1:3002` | `npx serve -s dist -l tcp://127.0.0.1:3002` |

nginx（`/etc/nginx/sites-enabled/neurobridge`）：

```
location /api/  → http://backend   (upstream backend → localhost:8003)
location /      → http://frontend  (upstream frontend → localhost:3002)
```

---

## 后端部署

```bash
ssh ton-ton

# 1. 同步代码（仓库 → 服务器）
#    服务器上 /opt/neurobridge 不是 git 仓库，需要手动同步；
#    推荐做法：本地改完 → commit/push → 服务器上 pull 或 scp。
cd /opt/neurobridge/backend

# 2. 依赖
python3 -m pip install -r requirements.txt

# 3. 环境变量（首次部署 / 密钥变更）
#    文件：/opt/neurobridge/backend/.env，权限 640，属主 root
#    必须包含：
#      QWEN_API_KEY=sk-...          # 阿里云百炼（主要）
#      XAI_API_KEY=xai-...          # 次要
#      XAI_MODEL=grok-...
#      OPENAI_API_KEY=sk-proj-...    # 兜底
#      WENXIN_API_KEY=...           # 备用
#      WENXIN_SECRET_KEY=...
#      JWT_SECRET_KEY=...           # 必填，随机长串
#      DEBUG=false                  # 生产必须 false
#      ALLOWED_ORIGINS=https://neurobridge.ton-ton.fun
#    ⚠️ 绝不要把占位符值（如 your_wenxxx）留在生产 .env 里：
#       对应适配器会被判定为「可用」但调用必然失败。

# 4. 重启
sudo systemctl restart neurobridge-backend
sudo systemctl status neurobridge-backend
```

### 后端 API 前缀

所有接口在 `/api/v1` 下（`main.py`: `app.include_router(api_router, prefix="/api/v1")`）：

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/v1/health` | 健康检查 |
| GET | `/api/v1/status` | 适配器状态 |
| POST | `/api/v1/translate` | 主功能：翻译 + 意图/误解分析 |
| POST | `/api/v1/tone-adjust` | 语气调整 |

---

## 前端部署

```bash
ssh ton-ton
cd /opt/neurobridge/frontend

# ⚠️ Node 必须是 20.19+ 或 22.12+（Vite 7 要求）。Node 18 会报
#    "Vite requires Node.js version 20.19+ or 22.12+"
node -v   # 应为 v20.x
# 若为 18：curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs

# 安装 & 构建
npm ci          # 首次或 package-lock 变更后
npx vite build  # 产出 dist/

# 重启
sudo systemctl restart neurobridge-frontend
```

前端通过 `.env.production` 决定 API 地址。当前值：

```
VITE_API_BASE_URL=https://neurobridge.ton-ton.fun/api
```

若改为相对路径 `/api`，则由 nginx 同源代理，无需 CORS。

---

## 模型适配器与故障排查

后端按顺序尝试 4 个适配器（`app/services/llm_service.py`）：

| 顺序 | 适配器 | 需要 | 服务器可达性 |
|---|---|---|---|
| 1 | Qwen（阿里云百炼） | `QWEN_API_KEY` | ✅ 可达 |
| 2 | xAI | `XAI_API_KEY` | ❌ **网络不通** |
| 3 | Wenxin | `WENXIN_API_KEY` + `WENXIN_SECRET_KEY` | ⚠️ 值为占位符 |
| 4 | GPT（OpenAI） | `OPENAI_API_KEY` | ❌ **网络不通** |

### ⚠️ 已知约束

- **服务器到 `api.openai.com` / `api.x.ai` / `generativelanguage.googleapis.com` 网络不可达**
  （`Network is unreachable`）。这两个适配器在这台机器上**永远无法作为兜底**。
- 可达：`dashscope.aliyuncs.com`、`api.minimax.chat`、`api.deepseek.com`。
  若需要更多冗余，优先选这三家。

### 常见故障

**症状：`POST /api/v1/translate` 返回 500，首页正常**

```bash
sudo journalctl -u neurobridge-backend --no-pager -n 30 | grep -i error
```

| 日志关键字 | 原因 | 处理 |
|---|---|---|
| `Arrearage` / `overdue-payment` | 阿里云账号欠费 | 去百炼控制台充值 |
| `Access denied ... account is in good standing` | 同上 | 同上 |
| `rate_limit` / HTTP 429 | 触发限流 | 等待，或换 `qwen-plus` 之外的模型 |
| `No LLM adapters are available` | `.env` 密钥全缺或全为占位符 | 检查 `.env` |
| `Model not exist` | `self.model` 指向已下线模型 | 改 `app/adapters/qwen.py:15` 的 `self.model` |

**单独验证阿里云是否恢复**（不经过应用）：

```bash
cd /opt/neurobridge/backend
sudo python3 - << 'EOF'
import os, json, urllib.request, urllib.error
from dotenv import load_dotenv
load_dotenv("/opt/neurobridge/backend/.env")
key = os.environ["QWEN_API_KEY"]
body = json.dumps({"model":"qwen-plus","messages":[{"role":"user","content":"say ok"}],"max_tokens":10}).encode()
req = urllib.request.Request(
    "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    data=body, headers={"Authorization": f"Bearer {key}", "Content-Type":"application/json"})
try:
    r = urllib.request.urlopen(req, timeout=40)
    print("OK", json.loads(r.read())["choices"][0]["message"]["content"][:40])
except urllib.error.HTTPError as e:
    print("HTTP", e.code, e.read()[:200].decode(errors="replace"))
except Exception as e:
    print("ERR", type(e).__name__, e)
EOF
```

---

## 隐私说明（重要）

文本会经由本服务器转发给第三方模型服务商。服务端**只记录请求元数据与文本长度，
不记录原文**；翻译历史只存浏览器 localStorage。

前端 `PrivacyNotice.tsx` 与 `README.md` 已与此对齐。修改文案时两边都要改。

---

## 备份

```bash
# 配置文件
sudo cp -r /etc/nginx/sites-enabled/neurobridge /root/backup/
sudo cp /opt/neurobridge/backend/.env /root/backup/     # 含密钥，权限收紧
```

---

## 待办

- [ ] `/opt/neurobridge` 纳入 git 版本管理（目前无法追溯线上代码与 commit 的对应关系）
- [ ] 增加 xAI/OpenAI 之外的可用兜底适配器（DeepSeek / MiniMax 已在网络白名单内）
- [ ] `deploy.sh` / `deploy.ps1` 与本指南核对一致性
