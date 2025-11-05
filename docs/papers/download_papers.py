#!/usr/bin/env python3
"""
Live Bridge 论文下载和转换脚本
从 LITERATURE_NEW_PONDER.md 中提取链接，下载 PDF，并转换为 TXT

使用方法:
    python download_papers.py

依赖:
    pip install requests pypdf2 pdfplumber
"""

import os
import re
import requests
from pathlib import Path
from typing import List, Tuple
import json

# 配置
ROOT_DIR = Path(__file__).parent.parent.parent
PONDER_FILE = ROOT_DIR / "docs" / "literature" / "LITERATURE_NEW_PONDER.md"
TIER1_DIR = ROOT_DIR / "docs" / "papers" / "tier1-required"
TIER2_DIR = ROOT_DIR / "docs" / "papers" / "tier2-important"
DOWNLOADED_LOG = ROOT_DIR / "docs" / "papers" / "downloaded.json"

# Tier 1 必读文献（根据 LITERATURE_COMPREHENSIVE_ANALYSIS.md）
TIER1_PATTERNS = [
    r"Enhancing Communication Skills.*Tele-Operated Robots",
    r"Revolutionizing Communication.*Children.*ASD.*Generative AI",
    r"Multimodal Messaging App.*MAAN.*Adults.*ASD",
    r"Real-time Facial Emotion Recognition.*autism",
    r"Pragmatic Language Differences.*Conversation",
]

# Tier 2 重要文献
TIER2_PATTERNS = [
    r"Role of Inclusion.*Control.*Ownership.*Workplace AI-MC",
    r"Comparing Sentence-Level.*Message-Level.*Suggestions",
    r"Intersubjective Model.*AI-mediated Communication",
    r"real-time environmental translator.*emotion recognition",
]

def extract_links_from_markdown(file_path: Path) -> List[Tuple[str, str]]:
    """
    从 Markdown 文件中提取 [标题](链接) 格式的链接
    
    返回: [(标题, 链接), ...]
    """
    links = []
    pattern = r'\[([^\]]+)\]\((https://[^\)]+)\)'
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            matches = re.findall(pattern, content)
            links = [(title.strip(), url.strip()) for title, url in matches]
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
    
    return links

def classify_paper(title: str) -> str:
    """根据标题判断论文属于 Tier 1 还是 Tier 2"""
    title_lower = title.lower()
    
    # Tier 1 检查
    for pattern in TIER1_PATTERNS:
        if re.search(pattern, title, re.IGNORECASE):
            return "tier1"
    
    # Tier 2 检查
    for pattern in TIER2_PATTERNS:
        if re.search(pattern, title, re.IGNORECASE):
            return "tier2"
    
    # 根据关键词判断
    tier1_keywords = ["tele-operated robots", "generative ai", "maan", "facial emotion", "pragmatic language"]
    tier2_keywords = ["inclusion control ownership", "sentence-level message-level", "intersubjective", "environmental translator"]
    
    for keyword in tier1_keywords:
        if keyword in title_lower:
            return "tier1"
    
    for keyword in tier2_keywords:
        if keyword in title_lower:
            return "tier2"
    
    return "other"

def download_file(url: str, output_path: Path) -> bool:
    """下载文件到指定路径"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, stream=True, timeout=30)
        response.raise_for_status()
        
        with open(output_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        return True
    except Exception as e:
        print(f"Error downloading {url}: {e}")
        return False

def pdf_to_txt(pdf_path: Path) -> Path:
    """将 PDF 转换为 TXT（使用 pdfplumber）"""
    txt_path = pdf_path.with_suffix('.txt')
    
    try:
        import pdfplumber
        
        text_content = []
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    text_content.append(text)
        
        with open(txt_path, 'w', encoding='utf-8') as f:
            f.write('\n\n'.join(text_content))
        
        return txt_path
    except ImportError:
        print("Warning: pdfplumber not installed. Install with: pip install pdfplumber")
        return None
    except Exception as e:
        print(f"Error converting {pdf_path} to TXT: {e}")
        return None

def load_downloaded_log() -> dict:
    """加载已下载记录"""
    if DOWNLOADED_LOG.exists():
        try:
            with open(DOWNLOADED_LOG, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_downloaded_log(log: dict):
    """保存已下载记录"""
    with open(DOWNLOADED_LOG, 'w', encoding='utf-8') as f:
        json.dump(log, f, indent=2, ensure_ascii=False)

def sanitize_filename(title: str) -> str:
    """清理文件名，移除非法字符"""
    # 移除非法字符
    invalid_chars = '<>:"/\\|?*'
    for char in invalid_chars:
        title = title.replace(char, '_')
    # 限制长度
    if len(title) > 100:
        title = title[:100]
    return title.strip()

def main():
    """主函数"""
    print("=" * 60)
    print("Live Bridge 论文下载工具")
    print("=" * 60)
    
    # 创建目录
    TIER1_DIR.mkdir(parents=True, exist_ok=True)
    TIER2_DIR.mkdir(parents=True, exist_ok=True)
    
    # 检查文件是否存在
    if not PONDER_FILE.exists():
        print(f"Error: {PONDER_FILE} not found!")
        return
    
    # 提取链接
    print(f"\n读取文件: {PONDER_FILE}")
    links = extract_links_from_markdown(PONDER_FILE)
    print(f"找到 {len(links)} 个链接")
    
    # 加载已下载记录
    downloaded_log = load_downloaded_log()
    
    # 分类和下载
    tier1_count = 0
    tier2_count = 0
    other_count = 0
    
    for title, url in links:
        # 跳过非 PDF 链接
        if not url.startswith('https://'):
            continue
        
        # 检查是否已下载
        url_hash = hash(url)
        if str(url_hash) in downloaded_log:
            print(f"⏭️  已下载: {title[:50]}...")
            continue
        
        # 分类
        tier = classify_paper(title)
        
        if tier == "tier1":
            output_dir = TIER1_DIR
            tier1_count += 1
            prefix = "⭐ Tier 1"
        elif tier == "tier2":
            output_dir = TIER2_DIR
            tier2_count += 1
            prefix = "📄 Tier 2"
        else:
            output_dir = None
            other_count += 1
            prefix = "📝 Other"
            continue  # 只下载 Tier 1 和 Tier 2
        
        # 下载
        safe_title = sanitize_filename(title)
        pdf_path = output_dir / f"{safe_title}.pdf"
        
        print(f"\n{prefix}: {title}")
        print(f"   URL: {url}")
        print(f"   保存到: {pdf_path}")
        
        if download_file(url, pdf_path):
            print(f"   ✅ PDF 下载成功")
            
            # 转换为 TXT
            txt_path = pdf_to_txt(pdf_path)
            if txt_path:
                print(f"   ✅ TXT 转换成功: {txt_path}")
            
            # 记录
            downloaded_log[str(url_hash)] = {
                "title": title,
                "url": url,
                "tier": tier,
                "pdf_path": str(pdf_path),
                "txt_path": str(txt_path) if txt_path else None,
                "downloaded_at": str(Path(__file__).stat().st_mtime)
            }
        else:
            print(f"   ❌ 下载失败")
    
    # 保存记录
    save_downloaded_log(downloaded_log)
    
    # 统计
    print("\n" + "=" * 60)
    print("下载统计:")
    print(f"  Tier 1 (必读): {tier1_count} 篇")
    print(f"  Tier 2 (重要): {tier2_count} 篇")
    print(f"  其他: {other_count} 篇")
    print(f"  总计: {len(links)} 个链接")
    print("=" * 60)

if __name__ == "__main__":
    main()

