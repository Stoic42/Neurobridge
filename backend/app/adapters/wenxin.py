import os
import json
import aiohttp
from typing import Dict, Any
from app.adapters.base import LLMAdapter
from app.models.schemas import TranslationRequest, TranslationResult, ToneAdjustmentRequest, ToneAdjustmentResult

class WenxinAdapter(LLMAdapter):
    """Wenxin 4.5 LLM Adapter"""
    
    def __init__(self):
        super().__init__("Wenxin 4.5", timeout=8)
        self.api_key = os.getenv("WENXIN_API_KEY")
        self.secret_key = os.getenv("WENXIN_SECRET_KEY")
        self.access_token = None
        self.base_url = "https://aip.baidubce.com"
    
    async def check_availability(self) -> bool:
        """Check if Wenxin service is available"""
        try:
            if not self.api_key or not self.secret_key:
                return False
            
            # Get access token
            await self._get_access_token()
            return self.access_token is not None
        except Exception:
            return False
    
    async def _get_access_token(self):
        """Get access token from Baidu API"""
        if self.access_token:
            return self.access_token
        
        url = f"{self.base_url}/oauth/2.0/token"
        params = {
            "grant_type": "client_credentials",
            "client_id": self.api_key,
            "client_secret": self.secret_key
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    self.access_token = data.get("access_token")
                else:
                    raise Exception(f"Failed to get access token: {response.status}")
    
    async def translate(self, request: TranslationRequest) -> TranslationResult:
        """Perform translation using Wenxin 4.5"""
        if not await self.check_availability():
            raise Exception("Wenxin service is not available")
        
        # Prepare the prompt for translation
        prompt = self._build_translation_prompt(request)
        
        # Call Wenxin API
        response_data = await self._call_wenxin_api(prompt)
        
        # Parse response and create result
        return self._parse_translation_response(response_data, request)
    
    async def adjust_tone(self, request: ToneAdjustmentRequest) -> ToneAdjustmentResult:
        """Adjust text tone using Wenxin 4.5"""
        if not await self.check_availability():
            raise Exception("Wenxin service is not available")
        
        prompt = self._build_tone_adjustment_prompt(request)
        response_data = await self._call_wenxin_api(prompt)
        
        return self._parse_tone_response(response_data, request)
    
    def _build_translation_prompt(self, request: TranslationRequest) -> str:
        """Build prompt for translation request"""
        role_context = {
            "ASD": "autism spectrum disorder",
            "NT": "neurotypical",
            "UNCERTAIN": "uncertain neurotype"
        }
        
        return f"""
You are a communication bridge AI helping translate messages between {role_context[request.userRole]} and {role_context[request.targetRole]} users.

Original message: "{request.text}"

Please provide:
1. Intent: What the person is trying to communicate
2. Misunderstanding: Potential ways this could be misunderstood by {role_context[request.targetRole]} people
3. Rewrite: A clearer version that {role_context[request.targetRole]} people would better understand
4. Emotion: Assess the emotional intensity (0-100) and describe the emotional state

Format your response as JSON:
{{
    "intent": "...",
    "misunderstanding": "...", 
    "rewrite": "...",
    "emotionIntensity": 0-100,
    "emotionDescription": "...",
    "communicationTips": "..."
}}
"""
    
    def _build_tone_adjustment_prompt(self, request: ToneAdjustmentRequest) -> str:
        """Build prompt for tone adjustment request"""
        tone_descriptions = {
            "direct": "direct and straightforward",
            "gentle": "gentle and considerate", 
            "empathetic": "empathetic and understanding"
        }
        
        return f"""
Rewrite the following text to be more {tone_descriptions[request.tone]}:

Original text: "{request.text}"

Provide only the rewritten text, maintaining the core meaning but adjusting the tone to be {tone_descriptions[request.tone]}.
"""
    
    async def _call_wenxin_api(self, prompt: str) -> Dict[str, Any]:
        """Call Wenxin API with the given prompt"""
        url = f"{self.base_url}/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions"
        headers = {
            "Content-Type": "application/json"
        }
        
        payload = {
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.7,
            "max_output_tokens": 2000
        }
        
        params = {"access_token": self.access_token}
        
        async with aiohttp.ClientSession() as session:
            async with session.post(url, params=params, headers=headers, json=payload) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    raise Exception(f"Wenxin API error: {response.status}")
    
    def _parse_translation_response(self, response_data: Dict[str, Any], request: TranslationRequest) -> TranslationResult:
        """Parse Wenxin response into TranslationResult"""
        try:
            # Extract content from response
            content = response_data.get("result", "")
            
            # Try to parse as JSON first
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
                # Fallback parsing if JSON parsing fails
                return self._fallback_parse_translation(content, request)
                
        except Exception as e:
            # Return a safe fallback result
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
            content = response_data.get("result", request.text)
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
        # Simple text parsing as fallback
        lines = content.split('\n')
        
        intent = "Intent analysis unavailable"
        misunderstanding = "Misunderstanding analysis unavailable"
        rewrite = request.text
        emotion_intensity = 50
        emotion_description = "Emotional state unclear"
        
        # Try to extract information from text
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
