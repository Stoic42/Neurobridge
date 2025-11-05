# NeuroBridge Live Bridge - 技术实现文档

**版本**: v2.0 (Live Bridge)  
**目标**: 实现双人实时对话界面，AI 作为理解中介层  
**技术栈**: React + TypeScript + WebSocket + FastAPI + Python

---

## 📋 目录

1. [系统架构](#系统架构)
2. [后端实现](#后端实现)
3. [前端实现](#前端实现)
4. [数据流设计](#数据流设计)
5. [API 设计](#api-设计)
6. [WebSocket 协议](#websocket-协议)
7. [错误处理](#错误处理)
8. [性能优化](#性能优化)
9. [测试计划](#测试计划)

---

## 🏗️ 系统架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    NeuroBridge Live Bridge                  │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐         WebSocket         ┌──────────────┐
│   Frontend   │ ◄──────────────────────► │   Backend    │
│   (React)    │                           │   (FastAPI)   │
└──────────────┘                           └──────────────┘
      │                                          │
      │                                          │
┌─────┴─────┐                            ┌──────┴──────┐
│ User A    │                            │  LLM Service │
│ User B    │                            │  (Wenxin/    │
│           │                            │   GPT-4o)    │
└───────────┘                            └──────────────┘
```

### 组件分层

```
Frontend Layer
├── UI Components
│   ├── LeftPanel (User A interface)
│   ├── RightPanel (User B interface)
│   ├── AICenter (Real-time translation layer)
│   └── HistoryTimeline (Conversation history)
├── State Management
│   ├── WebSocket connection state
│   ├── Conversation messages
│   └── AI analysis results
└── Services
    ├── WebSocket client
    └── Message handler

Backend Layer
├── WebSocket Endpoint
│   ├── Connection manager
│   ├── Room manager
│   └── Message router
├── Translation Service (复用 v1)
│   ├── LLM adapters
│   ├── Prompt engineering
│   └── Response parsing
└── Real-time Sync
    ├── Message broadcasting
    └── State synchronization
```

---

## 🔧 后端实现

### 1. WebSocket 端点

#### 文件结构
```
backend/
├── websocket/
│   ├── __init__.py
│   ├── manager.py          # WebSocket 连接管理
│   ├── room.py              # 房间管理（双人对话）
│   └── handlers.py          # 消息处理逻辑
└── main.py                  # 添加 WebSocket 路由
```

#### 实现代码框架

```python
# backend/websocket/manager.py
from typing import Dict, Set
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # 房间管理: room_id -> {user_id: websocket}
        self.rooms: Dict[str, Dict[str, WebSocket]] = {}
        # 用户到房间的映射
        self.user_rooms: Dict[str, str] = {}
    
    async def connect(self, websocket: WebSocket, room_id: str, user_id: str):
        """建立 WebSocket 连接"""
        await websocket.accept()
        
        if room_id not in self.rooms:
            self.rooms[room_id] = {}
        
        self.rooms[room_id][user_id] = websocket
        self.user_rooms[user_id] = room_id
        
        # 通知房间内其他用户
        await self.broadcast_to_room(room_id, {
            "type": "user_joined",
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat()
        }, exclude_user=user_id)
    
    async def disconnect(self, user_id: str):
        """断开连接"""
        room_id = self.user_rooms.get(user_id)
        if room_id and user_id in self.rooms.get(room_id, {}):
            del self.rooms[room_id][user_id]
            del self.user_rooms[user_id]
            
            # 通知其他用户
            await self.broadcast_to_room(room_id, {
                "type": "user_left",
                "user_id": user_id
            })
    
    async def send_to_user(self, user_id: str, message: dict):
        """发送消息给特定用户"""
        room_id = self.user_rooms.get(user_id)
        if room_id and user_id in self.rooms.get(room_id, {}):
            websocket = self.rooms[room_id][user_id]
            await websocket.send_json(message)
    
    async def broadcast_to_room(self, room_id: str, message: dict, exclude_user: str = None):
        """广播消息到房间内所有用户"""
        if room_id not in self.rooms:
            return
        
        for user_id, websocket in self.rooms[room_id].items():
            if user_id != exclude_user:
                await websocket.send_json(message)
```

```python
# backend/websocket/handlers.py
from typing import Optional
from services.llm_service import LLMService
from websocket.manager import ConnectionManager

class MessageHandler:
    def __init__(self, manager: ConnectionManager):
        self.manager = manager
        self.llm_service = LLMService()
    
    async def handle_message(self, message: dict, user_id: str, room_id: str):
        """处理收到的消息"""
        msg_type = message.get("type")
        
        if msg_type == "text_message":
            await self.handle_text_message(message, user_id, room_id)
        elif msg_type == "typing_indicator":
            await self.handle_typing(message, user_id, room_id)
        elif msg_type == "request_analysis":
            await self.handle_analysis_request(message, user_id, room_id)
    
    async def handle_text_message(self, message: dict, user_id: str, room_id: str):
        """处理文本消息：发送给对端 + 触发 AI 分析"""
        # 1. 转发消息给对端用户
        other_user_id = self._get_other_user(room_id, user_id)
        if other_user_id:
            await self.manager.send_to_user(other_user_id, {
                "type": "message_received",
                "from_user": user_id,
                "text": message["text"],
                "timestamp": message.get("timestamp")
            })
        
        # 2. 触发 AI 分析（异步，不阻塞）
        asyncio.create_task(self._analyze_message(message, user_id, room_id))
    
    async def _analyze_message(self, message: dict, user_id: str, room_id: str):
        """异步分析消息：生成意图、误解、改写建议"""
        try:
            # 获取用户角色信息（从房间状态或消息中）
            speaker_role = message.get("speaker_role", "ASD")  # 或从用户配置获取
            listener_role = message.get("listener_role", "NT")  # 对端角色
            
            # 调用 LLM 服务（复用 v1 逻辑）
            result = await self.llm_service.translate(
                text=message["text"],
                speaker_role=speaker_role,
                listener_role=listener_role
            )
            
            # 广播分析结果给房间内所有用户
            await self.manager.broadcast_to_room(room_id, {
                "type": "analysis_result",
                "message_id": message.get("id"),
                "from_user": user_id,
                "intent": result.intent,
                "misread": result.misread,
                "rewrite_suggestions": result.rewrite_suggestions,
                "emotion_intensity": result.emotion_intensity,
                "timestamp": datetime.utcnow().isoformat()
            })
        except Exception as e:
            # 错误处理
            await self.manager.send_to_user(user_id, {
                "type": "analysis_error",
                "message_id": message.get("id"),
                "error": str(e)
            })
```

```python
# backend/main.py (添加 WebSocket 路由)
from fastapi import WebSocket, WebSocketDisconnect
from websocket.manager import ConnectionManager
from websocket.handlers import MessageHandler

manager = ConnectionManager()
message_handler = MessageHandler(manager)

@app.websocket("/ws/{room_id}/{user_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, user_id: str):
    """WebSocket 端点"""
    await manager.connect(websocket, room_id, user_id)
    
    try:
        while True:
            # 接收消息
            data = await websocket.receive_json()
            # 处理消息
            await message_handler.handle_message(data, user_id, room_id)
    
    except WebSocketDisconnect:
        await manager.disconnect(user_id)
```

### 2. 房间管理

```python
# backend/websocket/room.py
from typing import Dict, Optional
from datetime import datetime, timedelta

class Room:
    def __init__(self, room_id: str):
        self.room_id = room_id
        self.users: Dict[str, dict] = {}  # user_id -> {role, joined_at, ...}
        self.messages: list = []
        self.created_at = datetime.utcnow()
        self.last_activity = datetime.utcnow()
    
    def add_user(self, user_id: str, role: str = "ASD"):
        """添加用户到房间"""
        self.users[user_id] = {
            "role": role,
            "joined_at": datetime.utcnow()
        }
        self.last_activity = datetime.utcnow()
    
    def remove_user(self, user_id: str):
        """移除用户"""
        if user_id in self.users:
            del self.users[user_id]
        self.last_activity = datetime.utcnow()
    
    def get_other_user(self, user_id: str) -> Optional[str]:
        """获取房间内另一个用户ID"""
        other_users = [uid for uid in self.users.keys() if uid != user_id]
        return other_users[0] if other_users else None
    
    def is_full(self) -> bool:
        """检查房间是否已满（最多2人）"""
        return len(self.users) >= 2
    
    def is_empty(self) -> bool:
        """检查房间是否为空"""
        return len(self.users) == 0
```

### 3. 依赖安装

```bash
# backend/requirements.txt (添加)
websockets>=12.0
python-multipart>=0.0.6
```

---

## 💻 前端实现

### 1. WebSocket 客户端

#### 文件结构
```
frontend/src/
├── services/
│   ├── websocket.ts          # WebSocket 客户端封装
│   └── messageTypes.ts        # 消息类型定义
├── hooks/
│   └── useWebSocket.ts        # WebSocket React Hook
├── components/
│   ├── LiveBridge/
│   │   ├── LeftPanel.tsx      # 用户A界面
│   │   ├── RightPanel.tsx     # 用户B界面
│   │   ├── AICenter.tsx       # AI 翻译层
│   │   └── HistoryTimeline.tsx # 对话历史
│   └── MessageBubble.tsx      # 消息气泡组件
└── stores/
    └── conversationStore.ts   # 对话状态管理（Zustand）
```

#### WebSocket 客户端实现

```typescript
// frontend/src/services/messageTypes.ts
export interface BaseMessage {
  type: string;
  timestamp?: string;
}

export interface TextMessage extends BaseMessage {
  type: "text_message";
  id: string;
  text: string;
  speaker_role: "ASD" | "NT" | "Uncertain";
  listener_role: "ASD" | "NT" | "Uncertain";
}

export interface AnalysisResult extends BaseMessage {
  type: "analysis_result";
  message_id: string;
  from_user: string;
  intent: string;
  misread: string;
  rewrite_suggestions: {
    direct: string;
    warm: string;
    empathetic: string;
  };
  emotion_intensity: number;
}

export interface UserJoined extends BaseMessage {
  type: "user_joined";
  user_id: string;
}

export interface TypingIndicator extends BaseMessage {
  type: "typing_indicator";
  user_id: string;
  is_typing: boolean;
}
```

```typescript
// frontend/src/services/websocket.ts
import { BaseMessage } from './messageTypes';

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor(url: string) {
    this.url = url;
  }

  connect(roomId: string, userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = `${this.url}/ws/${roomId}/${userId}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: BaseMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket closed');
        this.attemptReconnect(roomId, userId);
      };
    });
  }

  private attemptReconnect(roomId: string, userId: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Reconnecting... (attempt ${this.reconnectAttempts})`);
        this.connect(roomId, userId).catch(console.error);
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  send(message: BaseMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket not connected');
    }
  }

  on(eventType: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    // 返回取消监听的函数
    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }

  private handleMessage(message: BaseMessage): void {
    const callbacks = this.listeners.get(message.type);
    if (callbacks) {
      callbacks.forEach(callback => callback(message));
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
```

### 2. React Hook

```typescript
// frontend/src/hooks/useWebSocket.ts
import { useEffect, useRef, useState } from 'react';
import { WebSocketClient } from '../services/websocket';

export function useWebSocket(url: string, roomId: string, userId: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const wsRef = useRef<WebSocketClient | null>(null);

  useEffect(() => {
    const client = new WebSocketClient(url);
    wsRef.current = client;

    client.connect(roomId, userId)
      .then(() => setIsConnected(true))
      .catch((err) => {
        setError(err);
        setIsConnected(false);
      });

    return () => {
      client.disconnect();
    };
  }, [url, roomId, userId]);

  const send = (message: any) => {
    wsRef.current?.send(message);
  };

  const on = (eventType: string, callback: (data: any) => void) => {
    return wsRef.current?.on(eventType, callback);
  };

  return { isConnected, error, send, on };
}
```

### 3. 状态管理（Zustand）

```typescript
// frontend/src/stores/conversationStore.ts
import { create } from 'zustand';
import { TextMessage, AnalysisResult } from '../services/messageTypes';

interface Message {
  id: string;
  text: string;
  fromUser: string;
  timestamp: string;
  analysis?: AnalysisResult;
}

interface ConversationState {
  messages: Message[];
  userARole: 'ASD' | 'NT' | 'Uncertain';
  userBRole: 'ASD' | 'NT' | 'Uncertain';
  roomId: string | null;
  addMessage: (message: Message) => void;
  updateMessageAnalysis: (messageId: string, analysis: AnalysisResult) => void;
  setRoles: (userA: 'ASD' | 'NT' | 'Uncertain', userB: 'ASD' | 'NT' | 'Uncertain') => void;
  clearMessages: () => void;
}

export const useConversationStore = create<ConversationState>((set) => ({
  messages: [],
  userARole: 'ASD',
  userBRole: 'NT',
  roomId: null,

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  updateMessageAnalysis: (messageId, analysis) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, analysis } : msg
      ),
    })),

  setRoles: (userA, userB) =>
    set({ userARole: userA, userBRole: userB }),

  clearMessages: () => set({ messages: [] }),
}));
```

### 4. 主要组件

```typescript
// frontend/src/components/LiveBridge/LiveBridge.tsx
import { useWebSocket } from '../../hooks/useWebSocket';
import { useConversationStore } from '../../stores/conversationStore';
import { LeftPanel } from './LeftPanel';
import { RightPanel } from './RightPanel';
import { AICenter } from './AICenter';
import { HistoryTimeline } from './HistoryTimeline';

export function LiveBridge() {
  const roomId = 'demo-room'; // 或从 URL 参数获取
  const userAId = 'user-a';
  const userBId = 'user-b';

  // WebSocket 连接（用户A）
  const { isConnected: isConnectedA, send: sendA, on: onA } = useWebSocket(
    'ws://localhost:8000',
    roomId,
    userAId
  );

  // WebSocket 连接（用户B）- 可以合并为一个连接管理
  const { isConnected: isConnectedB, send: sendB, on: onB } = useWebSocket(
    'ws://localhost:8000',
    roomId,
    userBId
  );

  const { messages, addMessage, updateMessageAnalysis } = useConversationStore();

  // 监听分析结果
  useEffect(() => {
    const unsubscribeA = onA?.('analysis_result', (result: AnalysisResult) => {
      updateMessageAnalysis(result.message_id, result);
    });

    const unsubscribeB = onB?.('analysis_result', (result: AnalysisResult) => {
      updateMessageAnalysis(result.message_id, result);
    });

    return () => {
      unsubscribeA?.();
      unsubscribeB?.();
    };
  }, [onA, onB, updateMessageAnalysis]);

  return (
    <div className="flex h-screen">
      <LeftPanel user={userAId} send={sendA} />
      <AICenter messages={messages} />
      <RightPanel user={userBId} send={sendB} />
      <HistoryTimeline messages={messages} />
    </div>
  );
}
```

---

## 📊 数据流设计

### 消息发送流程

```
User A 输入文本
    ↓
LeftPanel 组件
    ↓
WebSocketClient.send(TextMessage)
    ↓
后端 WebSocket 端点
    ↓
MessageHandler.handle_text_message()
    ├─→ 转发给 User B (send_to_user)
    └─→ 触发 AI 分析 (异步任务)
        ↓
    LLMService.translate()
        ↓
    生成 AnalysisResult
        ↓
    broadcast_to_room (分析结果)
        ↓
前端接收 (on('analysis_result'))
        ↓
更新 ConversationStore
        ↓
AICenter 组件显示分析结果
```

### 状态同步流程

```
用户加入房间
    ↓
WebSocket 连接建立
    ↓
后端发送 user_joined 事件
    ↓
前端更新 UI（显示"对方已连接"）
    ↓
用户发送消息
    ↓
实时同步到对端
```

---

## 🔌 API 设计

### WebSocket 端点

```
ws://localhost:8000/ws/{room_id}/{user_id}
```

### HTTP 端点（辅助）

```python
# 创建房间
POST /api/v1/rooms
{
  "user_a_id": "user-a",
  "user_b_id": "user-b",
  "user_a_role": "ASD",
  "user_b_role": "NT"
}
Response: {
  "room_id": "room-123",
  "created_at": "2025-01-XX..."
}

# 获取房间信息
GET /api/v1/rooms/{room_id}
Response: {
  "room_id": "room-123",
  "users": ["user-a", "user-b"],
  "messages_count": 10,
  "created_at": "..."
}
```

---

## 📡 WebSocket 协议

### 客户端 → 服务器

```typescript
// 文本消息
{
  "type": "text_message",
  "id": "msg-123",
  "text": "我不是否定你的情绪，我只是希望搞清楚原因",
  "speaker_role": "ASD",
  "listener_role": "NT",
  "timestamp": "2025-01-XXT..."
}

// 打字指示器
{
  "type": "typing_indicator",
  "user_id": "user-a",
  "is_typing": true
}

// 请求分析
{
  "type": "request_analysis",
  "message_id": "msg-123"
}
```

### 服务器 → 客户端

```typescript
// 分析结果
{
  "type": "analysis_result",
  "message_id": "msg-123",
  "from_user": "user-a",
  "intent": "我希望了解你情绪背后的逻辑，而不是忽略你的感受",
  "misread": "你在否定我的情绪",
  "rewrite_suggestions": {
    "direct": "...",
    "warm": "...",
    "empathetic": "我理解你现在不好受。等你准备好了，能和我说说发生了什么吗？"
  },
  "emotion_intensity": 45,
  "timestamp": "..."
}

// 用户加入
{
  "type": "user_joined",
  "user_id": "user-b",
  "timestamp": "..."
}

// 消息接收
{
  "type": "message_received",
  "from_user": "user-a",
  "text": "...",
  "timestamp": "..."
}
```

---

## ⚠️ 错误处理

### 后端错误处理

```python
# 连接错误
try:
    await websocket.accept()
except Exception as e:
    logger.error(f"WebSocket accept failed: {e}")
    return

# 消息处理错误
try:
    await message_handler.handle_message(data, user_id, room_id)
except Exception as e:
    await websocket.send_json({
        "type": "error",
        "message": "Failed to process message",
        "error": str(e)
    })
```

### 前端错误处理

```typescript
// 连接重试
const maxRetries = 5;
let retryCount = 0;

const connectWithRetry = async () => {
  try {
    await client.connect(roomId, userId);
  } catch (error) {
    if (retryCount < maxRetries) {
      retryCount++;
      setTimeout(connectWithRetry, 1000 * retryCount);
    } else {
      // 显示错误提示
      showError('无法连接到服务器，请刷新页面重试');
    }
  }
};
```

---

## 🚀 性能优化

### 1. 消息去重

```python
# 后端：防止重复处理
processed_messages = set()

async def handle_text_message(self, message: dict, ...):
    msg_id = message.get("id")
    if msg_id in processed_messages:
        return
    processed_messages.add(msg_id)
    # ... 处理逻辑
```

### 2. 防抖（打字指示器）

```typescript
// 前端：防抖打字指示器
const debounceTyping = useMemo(
  () => debounce((isTyping: boolean) => {
    send({ type: 'typing_indicator', is_typing: isTyping });
  }, 500),
  [send]
);
```

### 3. 消息限流

```python
# 后端：限制消息频率
from datetime import datetime, timedelta

user_last_message = {}

async def handle_text_message(self, message: dict, user_id: str, ...):
    now = datetime.utcnow()
    last_time = user_last_message.get(user_id)
    
    if last_time and (now - last_time) < timedelta(seconds=1):
        # 消息太频繁，忽略
        return
    
    user_last_message[user_id] = now
    # ... 处理逻辑
```

### 4. AI 分析缓存

```python
# 相同文本的分析结果缓存（短时间内）
from functools import lru_cache
from hashlib import md5

@lru_cache(maxsize=100)
def get_cached_analysis(text_hash: str, speaker: str, listener: str):
    # 缓存逻辑
    pass
```

---

## 🧪 测试计划

### 单元测试

```python
# tests/test_websocket.py
import pytest
from websocket.manager import ConnectionManager

@pytest.mark.asyncio
async def test_connection_manager():
    manager = ConnectionManager()
    # 测试连接、断开、广播
    pass
```

### 集成测试

```python
# tests/test_integration.py
import pytest
from fastapi.testclient import TestClient

def test_websocket_connection():
    client = TestClient(app)
    with client.websocket_connect("/ws/test-room/user-a") as ws:
        ws.send_json({"type": "text_message", "text": "Hello"})
        data = ws.receive_json()
        assert data["type"] == "message_received"
```

### 前端测试

```typescript
// frontend/src/__tests__/websocket.test.ts
import { WebSocketClient } from '../services/websocket';

describe('WebSocketClient', () => {
  it('should connect and send messages', async () => {
    const client = new WebSocketClient('ws://localhost:8000');
    // 测试逻辑
  });
});
```

---

## 📦 部署注意事项

### 1. WebSocket 代理配置

```nginx
# nginx.conf
location /ws {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 86400;
}
```

### 2. 环境变量

```bash
# .env
WS_URL=ws://localhost:8000
ROOM_ID_PREFIX=room-
MAX_ROOM_SIZE=2
MESSAGE_RATE_LIMIT=10  # 每秒最多10条消息
```

---

## 📝 开发时间表（细化版）

| 时间 | 任务 | 具体实现 |
|------|------|----------|
| **H1 (0:45)** | WebSocket 基础 | 后端 WebSocket 端点 + 前端连接 |
| **H2 (0:45)** | 双屏布局 + 消息同步 | React 组件 + 状态管理 |
| **H3 (1:15)** | AI 分析集成 | 复用 v1 LLM 服务 + 实时分析 |
| **H4 (0:45)** | UI 优化 + 错误处理 | 加载状态 + 重连逻辑 |
| **H5 (0:30)** | Demo 准备 | 测试脚本 + 演示场景 |

---

**最后更新**: 2025-01-XX  
**状态**: 技术设计完成，待实现

