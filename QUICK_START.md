# 快速启动指南

## ✅ API配置状态

- **Qwen API**: ✅ 已配置并测试通过
- **系统状态**: ✅ 可以正常运行

## 启动步骤

### 1. 安装依赖

#### 后端依赖
```bash
cd backend
pip install -r requirements.txt
```

#### 前端依赖
```bash
cd frontend
npm install
```

### 2. 启动后端服务

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

后端将在 http://localhost:8000 运行

### 3. 启动前端服务

在新的终端窗口：

```bash
cd frontend
npm run dev
```

前端将在 http://localhost:5173 运行

### 4. 访问应用

打开浏览器访问: http://localhost:5173

## 测试API

如果想测试API配置：

```bash
cd backend
python test_api_keys.py
```

## 功能说明

### 翻译功能
- 输入文本
- 选择用户角色（ASD/NT/不确定）
- 选择目标角色（ASD/NT）
- 点击"翻译"获取结果

### 语气调整
- 输入文本
- 选择目标语气（直接/温和/共情）
- 点击"调整语气"获取结果

## API服务

当前使用 **Qwen (通义千问)** 作为主要AI服务：
- 中文支持优秀
- 响应速度快
- 理解神经多样性沟通需求

## 故障排除

### 后端启动失败
- 检查Python版本（需要3.8+）
- 确认已安装所有依赖
- 检查8000端口是否被占用

### 前端启动失败
- 检查Node.js版本（需要16+）
- 运行 `npm install` 重新安装依赖
- 检查5173端口是否被占用

### API调用失败
- 运行 `python backend/test_api_keys.py` 测试
- 检查 `backend/.env` 文件中的API密钥
- 查看后端日志了解详细错误

## 开发模式

两个服务都以开发模式运行：
- 后端：代码修改后自动重载
- 前端：代码修改后自动热更新

## 下一步

查看以下文档了解更多：
- `backend/API_SETUP.md` - API配置详情
- `backend/API_STATUS.md` - API状态报告
- `.kiro/specs/neurodiversity-translator/` - 项目规格说明
