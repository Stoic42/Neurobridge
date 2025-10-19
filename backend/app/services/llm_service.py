import asyncio
from typing import List, Optional
from app.adapters.base import LLMAdapter
from app.adapters.qwen import QwenAdapter
from app.adapters.xai import XAIAdapter
from app.adapters.wenxin import WenxinAdapter
from app.adapters.gpt import GPTAdapter
from app.models.schemas import TranslationRequest, TranslationResult, ToneAdjustmentRequest, ToneAdjustmentResult
import structlog

logger = structlog.get_logger()

class LLMService:
    """Service for managing LLM adapters with failover support"""
    
    def __init__(self):
        self.adapters: List[LLMAdapter] = [
            QwenAdapter(),    # Primary adapter
            XAIAdapter(),     # Secondary adapter
            WenxinAdapter(),  # Tertiary adapter
            GPTAdapter(),     # Fallback adapter
        ]
        self.current_adapter: Optional[LLMAdapter] = None
        self._initialize_adapters()
    
    def _initialize_adapters(self):
        """Initialize and check adapter availability"""
        for adapter in self.adapters:
            try:
                # Check availability asynchronously
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    # If we're in an async context, schedule the check
                    asyncio.create_task(self._check_adapter(adapter))
                else:
                    # If not, run it synchronously (for initialization)
                    loop.run_until_complete(self._check_adapter(adapter))
            except Exception as e:
                logger.warning(f"Failed to initialize {adapter.name}", error=str(e))
    
    async def _check_adapter(self, adapter: LLMAdapter):
        """Check if an adapter is available"""
        try:
            adapter.is_available = await adapter.check_availability()
            if adapter.is_available and not self.current_adapter:
                self.current_adapter = adapter
                logger.info(f"Selected {adapter.name} as primary adapter")
        except Exception as e:
            logger.warning(f"Adapter {adapter.name} not available", error=str(e))
    
    async def translate(self, request: TranslationRequest) -> TranslationResult:
        """Translate text with automatic failover"""
        if not self.current_adapter:
            await self._select_available_adapter()
        
        if not self.current_adapter:
            raise Exception("No LLM adapters are available")
        
        try:
            logger.info(f"Using {self.current_adapter.name} for translation")
            return await self.current_adapter.translate(request)
        except Exception as e:
            logger.error(f"Translation failed with {self.current_adapter.name}", error=str(e))
            
            # Try fallback adapters
            for adapter in self.adapters:
                if adapter != self.current_adapter and adapter.is_available:
                    try:
                        logger.info(f"Trying fallback adapter: {adapter.name}")
                        result = await adapter.translate(request)
                        self.current_adapter = adapter  # Switch to working adapter
                        return result
                    except Exception as fallback_error:
                        logger.warning(f"Fallback adapter {adapter.name} also failed", error=str(fallback_error))
                        continue
            
            # If all adapters failed, raise the original error
            raise e
    
    async def adjust_tone(self, request: ToneAdjustmentRequest) -> ToneAdjustmentResult:
        """Adjust text tone with automatic failover"""
        if not self.current_adapter:
            await self._select_available_adapter()
        
        if not self.current_adapter:
            raise Exception("No LLM adapters are available")
        
        try:
            logger.info(f"Using {self.current_adapter.name} for tone adjustment")
            return await self.current_adapter.adjust_tone(request)
        except Exception as e:
            logger.error(f"Tone adjustment failed with {self.current_adapter.name}", error=str(e))
            
            # Try fallback adapters
            for adapter in self.adapters:
                if adapter != self.current_adapter and adapter.is_available:
                    try:
                        logger.info(f"Trying fallback adapter: {adapter.name}")
                        result = await adapter.adjust_tone(request)
                        self.current_adapter = adapter  # Switch to working adapter
                        return result
                    except Exception as fallback_error:
                        logger.warning(f"Fallback adapter {adapter.name} also failed", error=str(fallback_error))
                        continue
            
            # If all adapters failed, raise the original error
            raise e
    
    async def _select_available_adapter(self):
        """Select the first available adapter"""
        for adapter in self.adapters:
            try:
                if await adapter.check_availability():
                    self.current_adapter = adapter
                    adapter.is_available = True
                    logger.info(f"Selected {adapter.name} as primary adapter")
                    return
            except Exception as e:
                logger.warning(f"Adapter {adapter.name} not available", error=str(e))
        
        logger.error("No adapters are available")
    
    async def get_service_status(self) -> dict:
        """Get status of all LLM services"""
        status = {}
        
        for adapter in self.adapters:
            try:
                is_available = await adapter.check_availability()
                status[adapter.name.lower().replace(" ", "_")] = "available" if is_available else "unavailable"
            except Exception:
                status[adapter.name.lower().replace(" ", "_")] = "error"
        
        return status
    
    def get_current_adapter_name(self) -> Optional[str]:
        """Get the name of the currently active adapter"""
        return self.current_adapter.name if self.current_adapter else None
