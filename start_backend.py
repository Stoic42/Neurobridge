#!/usr/bin/env python3
"""
Startup script for NeuroBridge backend
"""

import os
import sys
import subprocess
from pathlib import Path

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ is required")
        sys.exit(1)
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} detected")

def check_dependencies():
    """Check if required packages are installed"""
    try:
        import fastapi
        import uvicorn
        import pydantic
        import aiohttp
        import structlog
        print("✅ All required packages are installed")
        return True
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("Please run: pip install -r requirements.txt")
        return False

def setup_environment():
    """Set up environment variables"""
    # Set default values if not already set
    env_vars = {
        'HOST': '0.0.0.0',
        'PORT': '8000',
        'DEBUG': 'False'
    }
    
    for key, default_value in env_vars.items():
        if key not in os.environ:
            os.environ[key] = default_value
            print(f"🔧 Set {key}={default_value}")

def start_server():
    """Start the FastAPI server"""
    print("🚀 Starting NeuroBridge Backend Server...")
    print("=" * 50)
    
    # Change to backend directory
    backend_dir = Path(__file__).parent / "backend"
    os.chdir(backend_dir)
    
    # Start the server
    try:
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "main:app", 
            "--host", os.environ.get('HOST', '0.0.0.0'),
            "--port", os.environ.get('PORT', '8000'),
            "--reload"
        ], check=True)
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"❌ Server failed to start: {e}")
        sys.exit(1)

def main():
    """Main startup function"""
    print("🌉 NeuroBridge Backend Startup")
    print("=" * 50)
    
    # Check Python version
    check_python_version()
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Setup environment
    setup_environment()
    
    # Start server
    start_server()

if __name__ == "__main__":
    main()
