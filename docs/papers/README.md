# 论文下载和使用指南

**创建日期**: 2025-11-05

---

## 📁 文件夹结构

```
docs/papers/
├── tier1-required/      # Tier 1 必读文献（PDF + TXT）
├── tier2-important/     # Tier 2 重要文献（PDF + TXT）
├── download_papers.py   # 自动下载脚本
├── downloaded.json      # 下载记录（自动生成）
├── REQUIRED_PAPERS_LIST.md  # 必读文献清单
├── SEARCH_KEYWORDS.md   # 搜索关键词指南
└── README.md            # 本文件
```

---

## 🚀 快速开始

### 1. 安装依赖

```bash
pip install requests pdfplumber
```

### 2. 运行下载脚本

```bash
cd docs/papers
python download_papers.py
```

脚本会自动：
- ✅ 从 `LITERATURE_NEW_PONDER.md` 提取链接
- ✅ 根据标题自动分类（Tier 1 或 Tier 2）
- ✅ 下载 PDF 到对应文件夹
- ✅ 转换为 TXT 格式（便于 AI 阅读）
- ✅ 记录下载状态，避免重复下载

### 3. 查看下载结果

下载完成后，检查：
- `tier1-required/` - 5 篇必读文献
- `tier2-important/` - 5 篇重要文献
- `downloaded.json` - 下载记录

---

## 📋 必读文献清单

详见 `REQUIRED_PAPERS_LIST.md`

### Tier 1: 必读（5 篇）
1. Enhancing Communication Skills Using Tele-Operated Robots
2. Revolutionizing Communication for Children with ASD through Generative AI
3. A Multimodal Messaging App (MAAN) for Adults With ASD
4. Real-time Facial Emotion Recognition Model
5. Pragmatic Language Differences in Conversation

### Tier 2: 重要（5 篇）
6. The Role of Inclusion, Control, and Ownership in Workplace AI-MC
7. Comparing Sentence-Level vs Message-Level Suggestions
8. Intersubjective Model of AI-mediated Communication
9. A real-time environmental translator for emotion recognition
10. Methodological Middle Spaces

---

## 🔍 搜索关键词

如果需要搜索更多文献，参考 `SEARCH_KEYWORDS.md`：

### 双向 vs 单向对比研究
- `"bidirectional" AND "AI-mediated communication" AND "comparison"`
- `"two-way" AND "mediation" AND "communication"`

### 长期效果追踪（1 年+）
- `"long-term" AND "autism" AND "communication intervention" AND "1 year"`
- `"longitudinal study" AND "ASD" AND "communication" AND "follow-up"`

---

## 📝 使用建议

### 阅读顺序

1. **先读 Tier 1（必读）**
   - 这些文献提供了核心创新支撑和实证数据
   - 建议顺序：1 → 2 → 3 → 4 → 5

2. **再读 Tier 2（重要）**
   - 这些文献提供了设计原则和方法论参考
   - 可以按需阅读

### 与 AI 共同阅读

1. **TXT 格式的优势**
   - TXT 文件可以直接被 AI 读取和分析
   - 方便提取关键数据和引用

2. **使用方式**
   - 将 TXT 文件内容粘贴到对话中
   - 或让 AI 读取文件路径进行分析

---

## ⚠️ 注意事项

1. **下载可能失败**
   - 某些链接可能需要认证或付费
   - 如果脚本失败，可以手动访问链接下载

2. **PDF 转换**
   - 某些 PDF 可能无法完美转换（特别是扫描版）
   - 建议同时保留 PDF 和 TXT 版本

3. **版权**
   - 下载的论文仅供个人研究使用
   - 请遵守版权法规

---

## 🛠️ 故障排除

### 问题 1: 下载失败

**原因**: 网络问题或链接失效

**解决**:
1. 检查网络连接
2. 手动访问链接验证
3. 如果链接失效，尝试在论文数据库中搜索标题

### 问题 2: PDF 转换失败

**原因**: `pdfplumber` 未安装或 PDF 格式不支持

**解决**:
```bash
pip install pdfplumber
```

如果仍然失败，可以：
1. 使用在线 PDF 转 TXT 工具
2. 或只保留 PDF 版本

### 问题 3: 分类错误

**原因**: 脚本根据标题关键词分类，可能不准确

**解决**:
1. 手动检查分类结果
2. 将文件移动到正确的文件夹
3. 修改 `download_papers.py` 中的分类逻辑

---

## 📚 相关文档

- `../literature/LITERATURE_COMPREHENSIVE_ANALYSIS.md` - 完整文献分析
- `../literature/LITERATURE_NEW_PONDER.md` - 原始文献链接
- `REQUIRED_PAPERS_LIST.md` - 必读文献清单
- `SEARCH_KEYWORDS.md` - 搜索关键词指南

---

**最后更新**: 2025-11-05

