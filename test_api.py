#!/usr/bin/env python3
"""
Simple test script for NeuroBridge API
"""

import asyncio
import aiohttp
import json
from typing import Dict, Any

async def test_api():
    """Test the NeuroBridge API endpoints"""
    
    base_url = "http://localhost:8000"
    
    # Test data
    test_translation = {
        "text": "I'm really frustrated with this situation and I need help right now!",
        "userRole": "ASD",
        "targetRole": "NT"
    }
    
    test_tone_adjustment = {
        "text": "I need help with this problem.",
        "tone": "empathetic",
        "userRole": "ASD"
    }
    
    async with aiohttp.ClientSession() as session:
        print("🧪 Testing NeuroBridge API...")
        print("=" * 50)
        
        # Test health endpoint
        try:
            async with session.get(f"{base_url}/api/v1/health") as response:
                if response.status == 200:
                    health_data = await response.json()
                    print(f"✅ Health Check: {health_data['status']}")
                else:
                    print(f"❌ Health Check Failed: {response.status}")
        except Exception as e:
            print(f"❌ Health Check Error: {e}")
        
        # Test status endpoint
        try:
            async with session.get(f"{base_url}/api/v1/status") as response:
                if response.status == 200:
                    status_data = await response.json()
                    print(f"✅ Status Check: {status_data.get('api', 'Unknown')}")
                else:
                    print(f"❌ Status Check Failed: {response.status}")
        except Exception as e:
            print(f"❌ Status Check Error: {e}")
        
        # Test translation endpoint
        try:
            async with session.post(
                f"{base_url}/api/v1/translate",
                json=test_translation,
                headers={"Content-Type": "application/json"}
            ) as response:
                if response.status == 200:
                    translation_data = await response.json()
                    print(f"✅ Translation Test:")
                    print(f"   Intent: {translation_data.get('intent', 'N/A')[:50]}...")
                    print(f"   Emotion: {translation_data.get('emotionIntensity', 'N/A')}/100")
                else:
                    error_text = await response.text()
                    print(f"❌ Translation Failed: {response.status} - {error_text}")
        except Exception as e:
            print(f"❌ Translation Error: {e}")
        
        # Test tone adjustment endpoint
        try:
            async with session.post(
                f"{base_url}/api/v1/tone-adjust",
                json=test_tone_adjustment,
                headers={"Content-Type": "application/json"}
            ) as response:
                if response.status == 200:
                    tone_data = await response.json()
                    print(f"✅ Tone Adjustment Test:")
                    print(f"   Adjusted: {tone_data.get('adjustedText', 'N/A')[:50]}...")
                else:
                    error_text = await response.text()
                    print(f"❌ Tone Adjustment Failed: {response.status} - {error_text}")
        except Exception as e:
            print(f"❌ Tone Adjustment Error: {e}")
        
        print("=" * 50)
        print("🎉 API testing completed!")

if __name__ == "__main__":
    asyncio.run(test_api())
