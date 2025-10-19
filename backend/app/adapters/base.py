from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import asyncio
import time
from app.models.schemas import TranslationRequest, TranslationResult, ToneAdjustmentRequest, ToneAdjustmentResult

class LLMAdapter(ABC):
    """Base class for LLM adapters"""
    
    def __init__(self, name: str, timeout: int = 10):
        self.name = name
        self.timeout = timeout
        self.is_available = False
    
    @abstractmethod
    async def check_availability(self) -> bool:
        """Check if the LLM service is available"""
        pass
    
    @abstractmethod
    async def translate(self, request: TranslationRequest) -> TranslationResult:
        """Perform translation with intent parsing, misunderstanding prediction, and rewrite"""
        pass
    
    @abstractmethod
    async def adjust_tone(self, request: ToneAdjustmentRequest) -> ToneAdjustmentResult:
        """Adjust text tone to specified type"""
        pass
    
    async def _execute_with_timeout(self, coro, timeout: Optional[int] = None):
        """Execute coroutine with timeout"""
        timeout = timeout or self.timeout
        try:
            return await asyncio.wait_for(coro, timeout=timeout)
        except asyncio.TimeoutError:
            raise TimeoutError(f"{self.name} request timed out after {timeout} seconds")
    
    def _calculate_emotion_intensity(self, text: str, context: Dict[str, Any]) -> int:
        """Calculate emotion intensity score (0-100) based on text analysis"""
        # Simple heuristic-based emotion intensity calculation
        # In production, this could use more sophisticated NLP models
        
        intensity_indicators = {
            'high': ['urgent', 'critical', 'emergency', 'immediately', 'asap', 'now', '!', '!!!'],
            'medium': ['important', 'please', 'need', 'should', 'must', '?'],
            'low': ['maybe', 'perhaps', 'could', 'might', 'if possible']
        }
        
        text_lower = text.lower()
        score = 50  # Base score
        
        # Check for high intensity indicators
        for indicator in intensity_indicators['high']:
            if indicator in text_lower:
                score += 20
                break
        
        # Check for medium intensity indicators
        for indicator in intensity_indicators['medium']:
            if indicator in text_lower:
                score += 10
                break
        
        # Check for low intensity indicators
        for indicator in intensity_indicators['low']:
            if indicator in text_lower:
                score -= 10
                break
        
        # Adjust based on punctuation
        exclamation_count = text.count('!')
        question_count = text.count('?')
        score += (exclamation_count * 5) - (question_count * 2)
        
        # Ensure score is within bounds
        return max(0, min(100, score))
    
    def _get_emotion_description(self, intensity: int) -> str:
        """Get human-readable emotion description based on intensity score"""
        if intensity >= 80:
            return "Very high emotional intensity - consider taking a break"
        elif intensity >= 60:
            return "High emotional intensity - communication may be challenging"
        elif intensity >= 40:
            return "Moderate emotional intensity - normal communication range"
        elif intensity >= 20:
            return "Low emotional intensity - calm communication"
        else:
            return "Very low emotional intensity - very calm state"
