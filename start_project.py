#!/usr/bin/env python3
"""
Complete startup script for NeuroBridge project
"""

import os
import sys
import subprocess
import time
import threading
from pathlib import Path

def print_banner():
    """Print project banner"""
    print("🌉" + "=" * 50)
    print("   NeuroBridge - AI Communication Bridge")
    print("   Bridging ASD & NT Communication")
    print("=" * 52)

def check_requirements():
    """Check if all requirements are met"""
    print("🔍 Checking requirements...")
    
    # Check Python version
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ is required")
        return False
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor}")
    
    # Check Node.js
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ Node.js {result.stdout.strip()}")
        else:
            print("❌ Node.js not found")
            return False
    except FileNotFoundError:
        print("❌ Node.js not found")
        return False
    
    # Check npm
    try:
        result = subprocess.run(['npm', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ npm {result.stdout.strip()}")
        else:
            print("❌ npm not found")
            return False
    except FileNotFoundError:
        print("❌ npm not found")
        return False
    
    return True

def install_backend_dependencies():
    """Install backend dependencies"""
    print("\n📦 Installing backend dependencies...")
    backend_dir = Path(__file__).parent / "backend"
    
    try:
        subprocess.run([
            sys.executable, "-m", "pip", "install", "-r", "requirements.txt"
        ], cwd=backend_dir, check=True)
        print("✅ Backend dependencies installed")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install backend dependencies: {e}")
        return False

def install_frontend_dependencies():
    """Install frontend dependencies"""
    print("\n📦 Installing frontend dependencies...")
    frontend_dir = Path(__file__).parent / "frontend"
    
    try:
        subprocess.run(['npm', 'install'], cwd=frontend_dir, check=True)
        print("✅ Frontend dependencies installed")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install frontend dependencies: {e}")
        return False

def start_backend():
    """Start the backend server"""
    print("\n🚀 Starting backend server...")
    backend_dir = Path(__file__).parent / "backend"
    
    try:
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "main:app", 
            "--host", "0.0.0.0",
            "--port", "8000",
            "--reload"
        ], cwd=backend_dir)
    except KeyboardInterrupt:
        print("\n👋 Backend server stopped")

def start_frontend():
    """Start the frontend development server"""
    print("\n🚀 Starting frontend server...")
    frontend_dir = Path(__file__).parent / "frontend"
    
    try:
        subprocess.run(['npm', 'run', 'dev'], cwd=frontend_dir)
    except KeyboardInterrupt:
        print("\n👋 Frontend server stopped")

def main():
    """Main startup function"""
    print_banner()
    
    # Check requirements
    if not check_requirements():
        print("\n❌ Requirements not met. Please install missing dependencies.")
        sys.exit(1)
    
    # Install dependencies
    if not install_backend_dependencies():
        sys.exit(1)
    
    if not install_frontend_dependencies():
        sys.exit(1)
    
    print("\n🎉 All dependencies installed successfully!")
    print("\n📋 Next steps:")
    print("1. Set up your API keys in backend/.env file")
    print("2. Run 'python start_backend.py' to start the backend")
    print("3. Run 'cd frontend && npm run dev' to start the frontend")
    print("4. Open http://localhost:5173 in your browser")
    
    print("\n🔑 Required API Keys:")
    print("- WENXIN_API_KEY and WENXIN_SECRET_KEY (Baidu)")
    print("- OPENAI_API_KEY (OpenAI) - at least one is required")
    
    print("\n📖 For more information, see README.md")

if __name__ == "__main__":
    main()
