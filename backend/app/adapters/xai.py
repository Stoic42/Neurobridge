import os
import json
import aiohttp
from typing import Dict, Any
from app.adapters.base import LLMAdapter
from app.models.schemas import TranslationRequest, TranslationResult, ToneAdjustmentRequest, ToneAdjustmentResult

class XAIAdapter(LLMAdapter):
    """XAI (Grok) LLM Adapter"""
    
    def __init__(self):
        super().__init__("XAI-Grok", timeout=3600)  # Use longer timeout for reasoning models
        self.api_key = os.getenv("XAI_API_KEY")
        self.base_url = "https://api.x.ai/v1/chat/completions"
        # Try grok-beta first, fallback to other models if needed
        self.model = os.getenv("XAI_MODEL", "grok-beta")
    
    async def check_availability(self) -> bool:
        """Check if XAI service is available"""
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
                        {"role": "system", "content": "You are Grok, a highly intelligent, helpful AI assistant."},
                        {"role": "user", "content": "Hello"}
                    ],
                    "max_tokens": 10
                }
                
                async with session.post(self.base_url, headers=headers, json=payload, timeout=aiohttp.ClientTimeout(total=5)) as response:
                    return response.status == 200
        except Exception:
            return False
    
    async def translate(self, request: TranslationRequest) -> TranslationResult:
        """Perform translation using XAI"""
        prompt = self._build_translation_prompt(request)
        response_data = await self._call_xai_api(prompt)
        
        return self._parse_translation_response(response_data, request)
    
    async def adjust_tone(self, request: ToneAdjustmentRequest) -> ToneAdjustmentResult:
        """Adjust text tone using XAI"""
        prompt = self._build_tone_adjustment_prompt(request)
        response_data = await self._call_xai_api(prompt)
        
        return self._parse_tone_response(response_data, request)
    
    def _build_translation_prompt(self, request: TranslationRequest) -> dict:
        """Build prompt for translation request"""
        role_context = {
            "ASD": "autism spectrum disorder (ASD)",
            "NT": "neurotypical (NT)", 
            "UNCERTAIN": "uncertain neurotype"
        }
        
        system_message = "You are Grok, a highly intelligent, helpful AI assistant specialized in neurodiversity communication. You help bridge communication gaps between people with different neurotypes."
        
        user_message = f"""Analyze this message from a {role_context[request.userRole]} person intended for {role_context[request.targetRole]} people.

Original message: "{request.text}"

Provide a JSON response with:
1. "intent": What the person is trying to communicate
2. "misunderstanding": Potential ways this could be misunderstood by {role_context[request.targetRole]} people
3. "rewrite": A clearer version that {role_context[request.targetRole]} people would better understand
4. "emotionIntensity": Assess the emotional intensity (0-100)
5. "emotionDescription": Describe the emotional state
6. "communicationTips": Optional additional communication tips

Respond with valid JSON only, no markdown formatting."""
        
        return {"system": system_message, "user": user_message}
    
    def _build_tone_adjustment_prompt(self, request: ToneAdjustmentRequest) -> dict:
        """Build prompt for tone adjustment request"""
        tone_descriptions = {
            "direct": "direct and straightforward",
            "gentle": "gentle and considerate",
            "empathetic": "empathetic and understanding"
        }
        
        system_message = "You are Grok, a highly intelligent, helpful AI assistant specialized in communication tone adjustment."
        
        user_message = f"""Rewrite the following text to be more {tone_descriptions[request.tone]}:

Original text: "{request.text}"

Provide only the rewritten text, maintaining the core meaning but adjusting the tone to be {tone_descriptions[request.tone]}."""
        
        return {"system": system_message, "user": user_message}
    
    async def _call_xai_api(self, prompt: dict) -> Dict[str, Any]:
        """Call XAI API with the given prompt"""
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
            "max_tokens": 2000,
            "stream": False
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(self.base_url, headers=headers, json=payload, timeout=aiohttp.ClientTimeout(total=self.timeout)) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    error_text = await response.text()
                    raise Exception(f"XAI API error: {response.status} - {error_text}")
    
    def _parse_translation_response(self, response_data: Dict[str, Any], request: TranslationRequest) -> TranslationResult:
        """Parse XAI response into TranslationResult"""
        try:
            content = response_data.get("choices", [{}])[0].get("message", {}).get("content", "")
            
            try:
                parsed = json.loads(content)
                return TranslationResult(
                    intent=parsed.get("intent", "Unable to determine intent"),
                    misunderstanding=parsed.get("misunderstanding", "No specific misunderstandings identified"),
                    rewrite=parsed.get("rewrite", request.text),
                    emotionIntensity=parsed.get("emotionIntensity", 50),
                    emotionDescription=parsed.get("emotionDescription", "Moderate emotional state"),
                    communicationTips=parsed.get("communicationTips")
                )
            except json.JSONDecodeError:
                return self._fallback_parse_translation(content, request)
                
        except Exception:
            return TranslationResult(
                intent="Unable to parse intent",
                misunderstanding="Analysis unavailable",
                rewrite=request.text,
                emotionIntensity=50,
                emotionDescription="Unable to assess emotional state"
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
        
        intent = "Intent analysis unavailable"
        misunderstanding = "Misunderstanding analysis unavailable"
        rewrite = request.text
        emotion_intensity = 50
        emotion_description = "Emotional state unclear"
        
        for line in lines:
            if "intent:" in line.lower():
                intent = line.split(":", 1)[1].strip()
            elif "misunderstanding:" in line.lower():
                misunderstanding = line.split(":", 1)[1].strip()
            elif "rewrite:" in line.lower():
                rewrite = line.split(":", 1)[1].strip()
        
        return TranslationResult(
            intent=intent,
            misunderstanding=misunderstanding,
            rewrite=rewrite,
            emotionIntensity=emotion_intensity,
            emotionDescription=emotion_description
        )
