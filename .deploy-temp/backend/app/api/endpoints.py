from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
import time
import structlog
from app.models.schemas import (
    TranslationRequest, TranslationResult,
    ToneAdjustmentRequest, ToneAdjustmentResult,
    HealthResponse, ErrorResponse
)
from app.services.llm_service import LLMService

logger = structlog.get_logger()
router = APIRouter()

# Initialize LLM service
llm_service = LLMService()

@router.post("/translate", response_model=TranslationResult)
async def translate_text(request: TranslationRequest):
    """
    Translate text between ASD and NT communication styles
    
    - **text**: The text to translate
    - **userRole**: Current user's role (ASD, NT, or UNCERTAIN)
    - **targetRole**: Target audience role (ASD, NT, or UNCERTAIN)
    """
    start_time = time.time()
    
    try:
        logger.info("Translation request received", 
                   userRole=request.userRole, 
                   targetRole=request.targetRole,
                   textLength=len(request.text))
        
        # Perform translation
        result = await llm_service.translate(request)
        
        # Calculate processing time
        processing_time = time.time() - start_time
        
        logger.info("Translation completed", 
                   processingTime=processing_time,
                   emotionIntensity=result.emotionIntensity)
        
        # Check if processing took too long (3 second requirement)
        if processing_time > 3.0:
            logger.warning("Translation took longer than expected", 
                          processingTime=processing_time)
        
        return result
        
    except Exception as e:
        processing_time = time.time() - start_time
        logger.error("Translation failed", 
                    error=str(e), 
                    processingTime=processing_time)
        
        # Return appropriate error response
        if "timeout" in str(e).lower():
            raise HTTPException(
                status_code=408,
                detail="Translation request timed out. Please try again."
            )
        elif "not available" in str(e).lower():
            raise HTTPException(
                status_code=503,
                detail="Translation service is temporarily unavailable. Please try again later."
            )
        else:
            raise HTTPException(
                status_code=500,
                detail="Translation failed. Please try again."
            )

@router.post("/tone-adjust", response_model=ToneAdjustmentResult)
async def adjust_tone(request: ToneAdjustmentRequest):
    """
    Adjust text tone to be more direct, gentle, or empathetic
    
    - **text**: The text to adjust
    - **tone**: Desired tone (direct, gentle, or empathetic)
    - **userRole**: User's role for context
    """
    start_time = time.time()
    
    try:
        logger.info("Tone adjustment request received", 
                   tone=request.tone, 
                   userRole=request.userRole,
                   textLength=len(request.text))
        
        # Perform tone adjustment
        result = await llm_service.adjust_tone(request)
        
        # Calculate processing time
        processing_time = time.time() - start_time
        
        logger.info("Tone adjustment completed", 
                   processingTime=processing_time,
                   tone=result.tone)
        
        # Check if processing took too long (2 second requirement)
        if processing_time > 2.0:
            logger.warning("Tone adjustment took longer than expected", 
                          processingTime=processing_time)
        
        return result
        
    except Exception as e:
        processing_time = time.time() - start_time
        logger.error("Tone adjustment failed", 
                    error=str(e), 
                    processingTime=processing_time)
        
        # Return appropriate error response
        if "timeout" in str(e).lower():
            raise HTTPException(
                status_code=408,
                detail="Tone adjustment request timed out. Please try again."
            )
        elif "not available" in str(e).lower():
            raise HTTPException(
                status_code=503,
                detail="Tone adjustment service is temporarily unavailable. Please try again later."
            )
        else:
            raise HTTPException(
                status_code=500,
                detail="Tone adjustment failed. Please try again."
            )

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Check the health status of the API and all services
    """
    try:
        # Get service status
        services = await llm_service.get_service_status()
        current_adapter = llm_service.get_current_adapter_name()
        
        # Determine overall status
        overall_status = "healthy" if any(
            status == "available" for status in services.values()
        ) else "degraded"
        
        return HealthResponse(
            status=overall_status,
            services=services,
            version="1.0.0"
        )
        
    except Exception as e:
        logger.error("Health check failed", error=str(e))
        return HealthResponse(
            status="unhealthy",
            services={},
            version="1.0.0"
        )

@router.get("/status")
async def get_status():
    """
    Get detailed status information about the API
    """
    try:
        services = await llm_service.get_service_status()
        current_adapter = llm_service.get_current_adapter_name()
        
        return {
            "api": "NeuroBridge API",
            "version": "1.0.0",
            "currentAdapter": current_adapter,
            "services": services,
            "timestamp": time.time()
        }
        
    except Exception as e:
        logger.error("Status check failed", error=str(e))
        return {
            "api": "NeuroBridge API",
            "version": "1.0.0",
            "error": str(e),
            "timestamp": time.time()
        }
