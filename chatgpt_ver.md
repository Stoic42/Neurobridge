# NeuroBridge Translator — Hackathon MVP Pack

## 0) One‑liner & Positioning

**One‑liner:** *Translate intent, not just words.* 让 ASD（自闭症谱系）与 NT（神经典型）在人际沟通中“互相听懂”。

**Problem:** 直白 vs. 含蓄、逻辑优先 vs. 感受优先、非字面线索读取困难 → 误解与挫败。

**Solution:** 基于 AI 的“情绪—语义”翻译器：输入一句话 + 说话者/听话者画像 → 输出【真实意图】【可能误解】【更合适的表达】+ 情绪温度计 + 一键改写。

---

## 1) Name & Slogan

**候选名称**

1. **NeuroBridge**（主推）：弥合神经多样性沟通鸿沟。
2. **KindRelay**：善意中继站，从意图到表达。
3. **ClearMe / ClearWe**：让你/我们说清楚。
4. **SaySense**：让话语更有“道理”与“感受”。
5. **BetweenUs**：在你我之间，搭一座桥。

**Slogan 备选**

* “Translate intent, not just words.”
* “把你的语言，译成对方的理解。”
* “Less friction. More understanding.”
* “让直白与含蓄，彼此听懂。”

> 建议今日 Demo 使用：**NeuroBridge — Translate intent, not just words.**

---

## 2) MVP 功能清单（今日能跑通）

1. **角色选择**：ASD / NT / 不确定（默认 NT）。
2. **文本翻译器**：输入一句话 → 输出四块：

   * ① 说话者真实意图（Intent）
   * ② 听话者可能的误解（Misread）
   * ③ 面向对方的改写版本（Rewrite for X）
   * ④ 情绪温度计（0–100）
3. **沟通建议快速按钮**：更直接 / 更温和 / 先共情后提问。
4. **结果保存（本地）**：最近 10 条（localStorage）。
5. **隐私声明**：不做诊断；仅作沟通辅助。

**可选加分**

* 语音输入（Whisper / 浏览器录音）
* “理解墙”匿名案例（你的 SheTap 思路）
* 多语言（中/英）

---

## 3) 体系化交互（参考轻闪MBTI风格）

**信息结构**

* 顶栏：Logo + 角色切换（ASD / NT / 不确定）+ 语言切换
* 主卡片：输入框 +【翻译】按钮
* 结果区（卡片式）：Intent / Misread / Rewrite / 温度计
* 快捷建议：3 个 Pills（直接、温和、共情）→ 点击即替换 Rewrite 语气
* 页脚：免责声明 + 反馈入口

**状态**

* 空状态：提示“试着输入：‘我不是故意忽略你…’”
* 加载：线性进度条 + 语义小文案（“在桥上倾听…”）
* 错误：友好提示 + 重试

---

## 4) 技术架构（最小闭环）

**Front‑end**：React + Vite + Tailwind（或 shadcn/ui）

* Components：

  * RoleSelector、InputCard、ResultCard、TonePills、HeatMeter、HistoryList

**Back‑end**：FastAPI（/ Express 亦可）

* Endpoints：

  * `POST /api/translate`  → 返回 Intent/Misread/Rewrite/Heat
  * `POST /api/tone`       → 输入 base + 目标语气（direct/warm/empathy）
  * `GET  /api/health`
* Data：MVP 可无库；如需留存，SQLite：`logs(id, ts, role_speaker, role_listener, text_in, result_json)`

**Model Layer**（可抽象成 Adapter）

* `llm.translate(payload)`：注入系统提示 + 用户画像 + 句子
* 情绪温度计算法：结合情感分类 + 语气词规则（简单启发式）

**安全/隐私**

* 不上传可识别个人信息；默认不持久化内容
* 明确非诊断 / 非医疗声明

---

## 5) API 契约（MVP）

### `POST /api/translate`

**Request**

```json
{
  "speaker": "ASD|NT|Unknown",
  "listener": "ASD|NT|Unknown",
  "text": "我不知道为什么你要生气，这不合逻辑。",
  "lang": "zh|en"
}
```

**Response**

```json
{
  "intent": "我希望理解你情绪背后的原因，并非否定你的情绪",
  "misread": "你在否定我的感受/指责我不理性",
  "rewrite": "我不是在否定你的感受，我只是想更明白你为什么会难过。",
  "heat": 62
}
```

### `POST /api/tone`

**Request**

```json
{
  "base": "我不是否定你的感受，我只是想更明白原因。",
  "tone": "direct|warm|empathy",
  "lang": "zh"
}
```

**Response**

```json
{ "rewrite": "我理解你现在不好受。等你觉得OK时，能和我说说发生了什么吗？" }
```

---

## 6) Prompt 设计（核心）

**System Prompt（片段）**

```
你是“NeuroBridge”——一个情绪与语义翻译器。你的目标是：
1) 根据说话者(S)与听话者(L)的沟通风格差异（ASD/NT）解释真实意图；
2) 预判对方的常见误读；
3) 生成一条更适合被对方理解与接纳的表达；
4) 评估语句情绪强度(0–100)。
要求：简短、无评判、避免诊断化语言；优先清晰与共情。
```

**User Prompt 模板**

```
[句子] = "{text}"
[说话者] = {speaker}
[听话者] = {listener}
请输出 JSON：
{"intent":"…","misread":"…","rewrite":"…","heat":数字}
```

**Tone Prompt（改写语气）**

```
把下面句子改写为[{tone}]语气：更{direct/warm/empathetic}、更容易被[{listener}]理解。
仅输出改写后的句子。
```

---

## 7) UI 文案样例

* 占位符：`想试试吗？例如："不是我不回讯息，我只是需要独处恢复能量。"`
* 热度说明：`情绪温度计仅供参考，不代表情绪强度的医学评估。`
* 免责声明：`本工具仅用于沟通辅助，不提供诊断或治疗建议。`

---

## 8) 6 小时冲刺计划（到 Demo 可用）

**H1 需求澄清 (0:00–0:20)**：确定名称、Slogan、角色标签与输出字段。
**H2 前端框架 (0:20–1:20)**：Vite + Tailwind + 3 个核心组件。
**H3 后端与模型 (1:20–2:40)**：`/api/translate` 完成；情绪温度计规则版。
**H4 联调 (2:40–3:40)**：前后打通；加载与错误态。
**H5 语气改写 & 快捷建议 (3:40–4:20)**：`/api/tone`，3 个建议按钮。
**H6 打磨视觉 & 文案 (4:20–5:20)**：卡片阴影、进度条、空状态。
**H7 Demo 脚本 & 例子集 (5:20–6:00)**：准备 5 条常见冲突语句，演示不同组合（ASD→NT / NT→ASD）。

---

## 9) Demo 脚本（3 分钟）

1. **痛点(30s)：** ASD 与 NT 的表达/解读差异 → 误会成本高。
2. **现场输入(60s)：** 同一句话在两种方向翻译的不同结果；展示温度计与一键“更温和”。
3. **价值(30s)：** 更少摩擦、更快达成共识；非诊断、隐私友好。
4. **愿景(30s)：** 未来接语音、表情、持续记忆，链接“理解墙”。

---

## 10) 后续路线（v1–v3）

* **v1**：用户画像细化（直白/含蓄/字面/隐喻）、多语言、收藏与导出。
* **v2**：语音实时翻译、表情/凝视信号、上下文记忆（对同一关系的长期微调）。
* **v3**：案例库与社区、科研合作（匿名数据统计：高频误解类型、有效话术）。

---

## 11) 伦理与合规

* 明确**非医疗**，避免诊断化表述；
* 默认不留存个人数据，所有日志匿名化；
* 对未成年人使用场景增加监护提示；
* 为不同文化/语言提供本地化语料校正。

---

## 12) 视觉参考（轻闪MBTI风格的“温柔科普系”）

* 基色：柔和粉/薄荷绿/米白；强调色：淡紫
* 卡片圆角：`rounded-2xl`，投影 `shadow-lg`，留白充足
* 插画：扁平线性人物，淡表情；图标采用幽默轻松的小贴纸感

---

## 13) 任务分工模板（2–3 人）

* **FE**：输入卡、结果卡、温度计、语气 Pills、历史
* **BE**：接口 + Prompt、温度计规则、日志
* **产品/PM**：样例集、文案、本地化、Demo 演练

---

## 14) 可选附录 — 伪代码

```python
# FastAPI 轮廓
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Req(BaseModel):
    speaker: str
    listener: str
    text: str
    lang: str = "zh"

@app.post("/api/translate")
async def translate(r: Req):
    # 调用 llm_adapter(r) …
    return {
        "intent": "…",
        "misread": "…",
        "rewrite": "…",
        "heat": 57
    }
```

---

**Ready to build.** 需要我把前端 React 骨架 + API 路由也一并生成吗？我可以再开一个代码画布放“可运行”的单文件 Demo。
