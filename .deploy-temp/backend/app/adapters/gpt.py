import os
import json
import aiohttp
from typing import Dict, Any
from app.adapters.base import LLMAdapter
from app.models.schemas import TranslationRequest, TranslationResult, ToneAdjustmentRequest, ToneAdjustmentResult

class GPTAdapter(LLMAdapter):
    """GPT-4o LLM Adapter"""
    
    def __init__(self):
        super().__init__("GPT-4o", timeout=8)
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.base_url = "https://api.openai.com/v1/chat/completions"
    
    async def check_availability(self) -> bool:
        """Check if GPT service is available"""
        try:
            if not self.api_key:
                return False
            
            # Test API with a simple request
            async with aiohttp.ClientSession() as session:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": "gpt-4o",
                    "messages": [{"role": "user", "content": "Hello"}],
                    "max_tokens": 10
                }
                
                async with session.post(self.base_url, headers=headers, json=payload) as response:
                    return response.status == 200
        except Exception:
            return False
    
    async def translate(self, request: TranslationRequest) -> TranslationResult:
        """Perform translation using GPT-4o"""
        if not await self.check_availability():
            raise Exception("GPT service is not available")
        
        prompt = self._build_translation_prompt(request)
        response_data = await self._call_gpt_api(prompt)
        
        return self._parse_translation_response(response_data, request)
    
    async def adjust_tone(self, request: ToneAdjustmentRequest) -> ToneAdjustmentResult:
        """Adjust text tone using GPT-4o"""
        if not await self.check_availability():
            raise Exception("GPT service is not available")
        
        prompt = self._build_tone_adjustment_prompt(request)
        response_data = await self._call_gpt_api(prompt)
        
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

Please provide a JSON response with:
1. "intent": What the person is trying to communicate
2. "misunderstanding": Potential ways this could be misunderstood by {role_context[request.targetRole]} people
3. "rewrite": A clearer version that {role_context[request.targetRole]} people would better understand
4. "emotionIntensity": Assess the emotional intensity (0-100)
5. "emotionDescription": Describe the emotional state
6. "communicationTips": Optional additional communication tips

Respond with valid JSON only.
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
    
    async def _call_gpt_api(self, prompt: str) -> Dict[str, Any]:
        """Call GPT API with the given prompt"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "gpt-4o",
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.7,
            "max_tokens": 2000
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(self.base_url, headers=headers, json=payload) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    error_text = await response.text()
                    raise Exception(f"GPT API error: {response.status} - {error_text}")
    
    def _parse_translation_response(self, response_data: Dict[str, Any], request: TranslationRequest) -> TranslationResult:
        """Parse GPT response into TranslationResult"""
        try:
            content = response_data.get("choices", [{}])[0].get("message", {}).get("content", "")
            
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
