from pydantic import BaseModel, Field, validator
from typing import Optional, Literal
from datetime import datetime

# User role types
UserRole = Literal["ASD", "NT", "UNCERTAIN"]
ToneType = Literal["direct", "gentle", "empathetic"]

class TranslationRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000, description="Text to translate")
    userRole: UserRole = Field(..., description="Current user's role")
    targetRole: UserRole = Field(..., description="Target audience role")
    
    @validator('text')
    def validate_text(cls, v):
        if not v.strip():
            raise ValueError('Text cannot be empty or only whitespace')
        return v.strip()

class TranslationResult(BaseModel):
    intent: str = Field(..., description="Parsed intent of the message")
    misunderstanding: str = Field(..., description="Potential misunderstanding explanation")
    rewrite: str = Field(..., description="Improved version of the message")
    emotionIntensity: int = Field(..., ge=0, le=100, description="Emotion intensity score (0-100)")
    emotionDescription: str = Field(..., description="Description of emotional state")
    communicationTips: Optional[str] = Field(None, description="Additional communication tips")

class ToneAdjustmentRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)
    tone: ToneType = Field(..., description="Desired tone for adjustment")
    userRole: UserRole = Field(..., description="User's role for context")

class ToneAdjustmentResult(BaseModel):
    adjustedText: str = Field(..., description="Text adjusted to specified tone")
    tone: ToneType = Field(..., description="Applied tone")
    originalText: str = Field(..., description="Original text")

class HealthResponse(BaseModel):
    status: str = Field(..., description="Service status")
    services: dict = Field(..., description="Status of various services")
    version: str = Field(..., description="API version")
    timestamp: datetime = Field(default_factory=datetime.now)

class ErrorResponse(BaseModel):
    success: bool = Field(False, description="Request success status")
    error: str = Field(..., description="Error message")
    timestamp: datetime = Field(default_factory=datetime.now)
