"""
检查后端服务状态
"""
import asyncio
import sys
from app.services.llm_service import LLMService
from app.models.schemas import TranslationRequest

async def check_backend():
    """检查后端服务"""
    print("=" * 60)
    print("后端服务检查")
    print("=" * 60)
    
    # 1. 检查LLM服务初始化
    print("\n1. 初始化LLM服务...")
    try:
        llm_service = LLMService()
        print("   ✓ LLM服务初始化成功")
    except Exception as e:
        print(f"   ✗ LLM服务初始化失败: {e}")
        return False
    
    # 2. 检查服务状态
    print("\n2. 检查API服务状态...")
    try:
        status = await llm_service.get_service_status()
        for service, state in status.items():
            icon = "✓" if state == "available" else "✗"
            print(f"   {icon} {service}: {state}")
    except Exception as e:
        print(f"   ✗ 无法获取服务状态: {e}")
    
    # 3. 测试翻译功能
    print("\n3. 测试翻译功能...")
    try:
        request = TranslationRequest(
            text="我需要帮助",
            userRole="ASD",
            targetRole="NT"
        )
        result = await llm_service.translate(request)
        print(f"   ✓ 翻译成功")
        print(f"   当前使用: {llm_service.get_current_adapter_name()}")
        print(f"   意图: {result.intent[:50]}...")
        print(f"   改写: {result.rewrite[:50]}...")
        return True
    except Exception as e:
        print(f"   ✗ 翻译失败: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    success = await check_backend()
    print("\n" + "=" * 60)
    if success:
        print("✓ 后端服务正常，可以启动应用")
        print("\n启动命令:")
        print("  uvicorn main:app --reload --host 0.0.0.0 --port 8000")
    else:
        print("✗ 后端服务有问题，请检查配置")
    print("=" * 60)
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    asyncio.run(main())
