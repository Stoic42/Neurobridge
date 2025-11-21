import os
import json
import aiohttp
from typing import Dict, Any
from app.adapters.base import LLMAdapter
from app.models.schemas import TranslationRequest, TranslationResult, ToneAdjustmentRequest, ToneAdjustmentResult

class QwenAdapter(LLMAdapter):
    """Qwen LLM Adapter"""
    
    def __init__(self):
        super().__init__("Qwen", timeout=60)
        self.api_key = os.getenv("QWEN_API_KEY")
        self.base_url = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
        self.model = "qwen-plus"  # Using qwen-plus model
    
    async def check_availability(self) -> bool:
        """Check if Qwen service is available"""
        try:
            if not self.api_key:
                return False
            
            async with aiohttp.ClientSession() as session:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": "你是一个有帮助的AI助手。"},
                        {"role": "user", "content": "你好"}
                    ],
                    "max_tokens": 10
                }
                
                async with session.post(self.base_url, headers=headers, json=payload, timeout=aiohttp.ClientTimeout(total=5)) as response:
                    return response.status == 200
        except Exception:
            return False
    
    async def translate(self, request: TranslationRequest) -> TranslationResult:
        """Perform translation using Qwen"""
        prompt = self._build_translation_prompt(request)
        response_data = await self._call_qwen_api(prompt)
        
        return self._parse_translation_response(response_data, request)
    
    async def adjust_tone(self, request: ToneAdjustmentRequest) -> ToneAdjustmentResult:
        """Adjust text tone using Qwen"""
        prompt = self._build_tone_adjustment_prompt(request)
        response_data = await self._call_qwen_api(prompt)
        
        return self._parse_tone_response(response_data, request)
    
    def _build_translation_prompt(self, request: TranslationRequest) -> dict:
        """Build prompt for translation request"""
        role_context = {
            "ASD": "自闭症谱系障碍（ASD）",
            "NT": "神经典型（NT）", 
            "UNCERTAIN": "不确定的神经类型"
        }
        
        system_message = "你是一个专业的神经多样性沟通助手，帮助不同神经类型的人之间建立更好的沟通桥梁。你擅长分析沟通意图、识别潜在误解，并提供清晰的改写建议。"
        
        user_message = f"""分析这条来自{role_context[request.userRole]}人士、面向{role_context[request.targetRole]}人士的消息。

原始消息："{request.text}"

请提供一个JSON格式的响应，包含以下字段：
1. "intent": 发送者试图传达的真实意图
2. "misunderstanding": {role_context[request.targetRole]}人士可能产生的误解
3. "rewrite": 一个更清晰的改写版本，让{role_context[request.targetRole]}人士更容易理解
4. "emotionIntensity": 情绪强度评分（0-100的整数）
5. "emotionDescription": 情绪状态的描述
6. "communicationTips": 可选的额外沟通建议

只返回纯JSON格式，不要包含markdown代码块标记。"""
        
        return {"system": system_message, "user": user_message}
    
    def _build_tone_adjustment_prompt(self, request: ToneAdjustmentRequest) -> dict:
        """Build prompt for tone adjustment request"""
        tone_descriptions = {
            "direct": "直接和坦率",
            "gentle": "温和和体贴",
            "empathetic": "富有同理心和理解"
        }
        
        system_message = "你是一个专业的语气调整助手，擅长在保持原意的基础上调整文本的表达方式和语气。"
        
        user_message = f"""将以下文本改写得更加{tone_descriptions[request.tone]}：

原始文本："{request.text}"

只提供改写后的文本，保持核心含义但调整语气使其更加{tone_descriptions[request.tone]}。不要添加任何解释或额外内容。"""
        
        return {"system": system_message, "user": user_message}
    
    async def _call_qwen_api(self, prompt: dict) -> Dict[str, Any]:
        """Call Qwen API with the given prompt"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        messages = []
        if "system" in prompt:
            messages.append({"role": "system", "content": prompt["system"]})
        messages.append({"role": "user", "content": prompt["user"]})
        
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 2000
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(self.base_url, headers=headers, json=payload, timeout=aiohttp.ClientTimeout(total=self.timeout)) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    error_text = await response.text()
                    raise Exception(f"Qwen API error: {response.status} - {error_text}")
    
    def _parse_translation_response(self, response_data: Dict[str, Any], request: TranslationRequest) -> TranslationResult:
        """Parse Qwen response into TranslationResult"""
        try:
            content = response_data.get("choices", [{}])[0].get("message", {}).get("content", "")
            
            try:
                parsed = json.loads(content)
                return TranslationResult(
                    intent=parsed.get("intent", "无法确定意图"),
                    misunderstanding=parsed.get("misunderstanding", "未识别到特定的误解"),
                    rewrite=parsed.get("rewrite", request.text),
                    emotionIntensity=parsed.get("emotionIntensity", 50),
                    emotionDescription=parsed.get("emotionDescription", "中等情绪状态"),
                    communicationTips=parsed.get("communicationTips")
                )
            except json.JSONDecodeError:
                return self._fallback_parse_translation(content, request)
                
        except Exception:
            return TranslationResult(
                intent="无法解析意图",
                misunderstanding="分析不可用",
                rewrite=request.text,
                emotionIntensity=50,
                emotionDescription="无法评估情绪状态"
            )
    
    def _parse_tone_response(self, response_data: Dict[str, Any], request: ToneAdjustmentRequest) -> ToneAdjustmentResult:
        """Parse tone adjustment response"""
        try:
            content = response_data.get("choices", [{}])[0].get("message", {}).get("content", "")
            return ToneAdjustmentResult(
                adjustedText=content.strip(),
                tone=request.tone,
                originalText=request.text
            )
        except Exception:
            return ToneAdjustmentResult(
                adjustedText=request.text,
                tone=request.tone,
                originalText=request.text
            )
    
    def _fallback_parse_translation(self, content: str, request: TranslationRequest) -> TranslationResult:
        """Fallback parsing when JSON parsing fails"""
        lines = content.split('\n')
        
        intent = "意图分析不可用"
        misunderstanding = "误解分析不可用"
        rewrite = request.text
        emotion_intensity = 50
        emotion_description = "情绪状态不明确"
        
        for line in lines:
            if "intent:" in line.lower() or "意图:" in line:
                intent = line.split(":", 1)[1].strip()
            elif "misunderstanding:" in line.lower() or "误解:" in line:
                misunderstanding = line.split(":", 1)[1].strip()
            elif "rewrite:" in line.lower() or "改写:" in line:
                rewrite = line.split(":", 1)[1].strip()
        
        return TranslationResult(
            intent=intent,
            misunderstanding=misunderstanding,
            rewrite=rewrite,
            emotionIntensity=emotion_intensity,
            emotionDescription=emotion_description
        )
