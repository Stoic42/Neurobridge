"""
测试API密钥配置
Test API key configuration
"""
import asyncio
import os
from dotenv import load_dotenv
from app.adapters.qwen import QwenAdapter
from app.adapters.xai import XAIAdapter
from app.models.schemas import TranslationRequest

# 加载环境变量
load_dotenv()

async def test_qwen():
    """测试Qwen API"""
    print("\n=== 测试 Qwen API ===")
    adapter = QwenAdapter()
    
    # 检查API密钥
    api_key = os.getenv("QWEN_API_KEY")
    if not api_key:
        print("❌ 未找到 QWEN_API_KEY")
        return False
    print(f"✓ API密钥已配置: {api_key[:10]}...")
    
    # 检查可用性
    try:
        is_available = await adapter.check_availability()
        if is_available:
            print("✓ Qwen API 可用")
        else:
            print("❌ Qwen API 不可用")
            return False
    except Exception as e:
        print(f"❌ Qwen API 检查失败: {str(e)}")
        return False
    
    # 测试翻译功能
    try:
        request = TranslationRequest(
            text="我需要你帮我完成这个任务",
            userRole="ASD",
            targetRole="NT"
        )
        result = await adapter.translate(request)
        print(f"✓ 翻译测试成功")
        print(f"  意图: {result.intent}")
        print(f"  改写: {result.rewrite}")
        return True
    except Exception as e:
        print(f"❌ 翻译测试失败: {str(e)}")
        return False

async def test_xai():
    """测试XAI API"""
    print("\n=== 测试 XAI (Grok) API ===")
    adapter = XAIAdapter()
    
    # 检查API密钥
    api_key = os.getenv("XAI_API_KEY")
    if not api_key:
        print("❌ 未找到 XAI_API_KEY")
        return False
    print(f"✓ API密钥已配置: {api_key[:10]}...")
    
    # 检查可用性
    try:
        print("  正在检查API连接...")
        is_available = await adapter.check_availability()
        if is_available:
            print("✓ XAI API 可用")
        else:
            print("❌ XAI API 不可用 (可能是网络问题或API密钥无效)")
            print("  提示: XAI API可能需要特殊网络访问")
            return False
    except Exception as e:
        print(f"❌ XAI API 检查失败: {str(e)}")
        print(f"  错误类型: {type(e).__name__}")
        return False
    
    # 测试翻译功能
    try:
        request = TranslationRequest(
            text="I need you to help me with this task",
            userRole="ASD",
            targetRole="NT"
        )
        result = await adapter.translate(request)
        print(f"✓ 翻译测试成功")
        print(f"  Intent: {result.intent}")
        print(f"  Rewrite: {result.rewrite}")
        return True
    except Exception as e:
        print(f"❌ 翻译测试失败: {str(e)}")
        return False

async def main():
    """运行所有测试"""
    print("开始测试API配置...")
    print("=" * 50)
    
    qwen_ok = await test_qwen()
    xai_ok = await test_xai()
    
    print("\n" + "=" * 50)
    print("测试结果总结:")
    print(f"  Qwen API: {'✓ 通过' if qwen_ok else '❌ 失败'}")
    print(f"  XAI API:  {'✓ 通过' if xai_ok else '❌ 失败'}")
    
    if qwen_ok and xai_ok:
        print("\n🎉 所有API配置正确！")
    elif qwen_ok:
        print("\n✅ Qwen可用，系统可以正常运行！")
        print("   (XAI作为备用服务，可能需要网络代理或检查账户状态)")
    elif xai_ok:
        print("\n✅ XAI可用，系统可以正常运行！")
        print("   (建议配置Qwen以获得更好的中文支持)")
    else:
        print("\n❌ 需要检查API配置")

if __name__ == "__main__":
    asyncio.run(main())
