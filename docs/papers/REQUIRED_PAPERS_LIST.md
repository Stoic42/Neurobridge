# 必读文献清单（需下载）

**创建日期**: 2025-11-05  
**来源**: `LITERATURE_COMPREHENSIVE_ANALYSIS.md` 推荐阅读清单

---

## Tier 1: 必读（核心创新支撑）⭐⭐⭐⭐⭐

### 1. Enhancing Communication Skills Using Tele-Operated Robots
- **重要性**: ⭐⭐⭐⭐⭐
- **原因**: 实证研究，20 名 ASD，显著改善（F=6.583, p=0.019），实时中介有效性验证
- **链接**: https://d3n7w3548u188s.cloudfront.net/0090a4ca-5fdb-42d5-9fec-375471c54eec
- **标题**: "Enhancing Communication Skills of Individuals With Autism Spectrum Disorders While Maintaining Social Distancing Using Two Tele-Operated Robots"
- **文件夹**: `tier1-required/`

### 2. Revolutionizing Communication for Children with ASD through Generative AI
- **重要性**: ⭐⭐⭐⭐⭐
- **原因**: 量化数据：+40% 理解，+28% 对话启动，GenAI 在 ASD 中的应用
- **链接**: https://d3n7w3548u188s.cloudfront.net/19dc6f56-ae37-4b0a-ad45-6d53c17c36b8
- **标题**: "Revolutionizing Communication for Children with Autism Spectrum Disorder through Generative AI"
- **文件夹**: `tier1-required/`

### 3. A Multimodal Messaging App (MAAN) for Adults With ASD
- **重要性**: ⭐⭐⭐⭐⭐
- **原因**: 实际应用案例（10-16 周研究），社交孤独感显著降低（P=0.04），双人界面设计参考
- **链接**: https://d3n7w3548u188s.cloudfront.net/4ad74585-0b63-4d06-9a0c-d213b71218be
- **标题**: "A Multimodal Messaging App (MAAN) for Adults With Autism Spectrum Disorder: Mixed Methods Evaluation Study"
- **文件夹**: `tier1-required/`

### 4. Real-time Facial Emotion Recognition Model
- **重要性**: ⭐⭐⭐⭐⭐
- **原因**: 95.23% 准确率（6 种情绪），DCNN + 内核自动编码器，技术实现参考
- **链接**: https://d3n7w3548u188s.cloudfront.net/2d45e36b-1761-4bd0-91ec-af96cd16b26c
- **标题**: "Real-time facial emotion recognition model based on kernel autoencoder and convolutional neural network for autism children"
- **文件夹**: `tier1-required/`

### 5. Pragmatic Language Differences in Conversation
- **重要性**: ⭐⭐⭐⭐⭐
- **原因**: 意图分析实证研究（22 名 ASD vs 24 名 DSED），误解检测方法
- **链接**: https://d3n7w3548u188s.cloudfront.net/2c97146b-01f7-4050-89b4-816788f543d9
- **标题**: "Pragmatic Language Differences in Conversation Might Differentiate between Autism and Trauma-related Disorders"
- **文件夹**: `tier1-required/`

---

## Tier 2: 重要（设计原则）⭐⭐⭐⭐

### 6. The Role of Inclusion, Control, and Ownership in Workplace AI-MC
- **重要性**: ⭐⭐⭐⭐
- **原因**: 用户控制感研究，设计原则参考
- **链接**: https://d3n7w3548u188s.cloudfront.net/735ffe39-0622-4416-a3ce-71b660df407e
- **标题**: "The Role of Inclusion, Control, and Ownership in Workplace AI-Mediated Communication"
- **文件夹**: `tier2-important/`

### 7. Comparing Sentence-Level vs Message-Level Suggestions
- **重要性**: ⭐⭐⭐⭐
- **原因**: 建议粒度设计，用户控制 vs 效率平衡
- **链接**: https://d3n7w3548u188s.cloudfront.net/ee3dc283-aeed-445b-8ad4-0b43f5a9c8c9
- **标题**: "Comparing Sentence-Level Suggestions to Message-Level Suggestions in AI-Mediated Communication"
- **文件夹**: `tier2-important/`

### 8. Intersubjective Model of AI-mediated Communication
- **重要性**: ⭐⭐⭐⭐
- **原因**: 双向 AI 中介模型，核心创新点参考
- **链接**: https://d3n7w3548u188s.cloudfront.net/59e840c2-7dbb-442e-84ad-329a7f750f04
- **标题**: "Intersubjective Model of AI-mediated Communication: Augmenting Human-Human Text Chat through LLM-based Adaptive Agent Pair"
- **文件夹**: `tier2-important/`

### 9. A real-time environmental translator for emotion recognition
- **重要性**: ⭐⭐⭐⭐
- **原因**: 7 种情绪，19 分钟适应，多模态反馈设计
- **链接**: https://d3n7w3548u188s.cloudfront.net/66167972-dae3-4530-a5bb-fdd46cc908c6
- **标题**: "A real-time environmental translator for emotion recognition in autism spectrum disorder"
- **文件夹**: `tier2-important/`

### 10. Methodological Middle Spaces
- **重要性**: ⭐⭐⭐⭐
- **原因**: AI-MC 研究方法论，实验设计参考
- **链接**: https://d3n7w3548u188s.cloudfront.net/1157c589-316f-4c63-b1f0-c4020264eff4
- **标题**: "Methodological Middle Spaces: Addressing the Need for Methodological Innovation to Achieve Simultaneous Realism, Control, and Scalability in Experimental Studies of AI-Mediated Communication"
- **文件夹**: `tier2-important/`

---

## 下载状态

下载记录保存在 `downloaded.json` 中。

### 使用下载脚本

```bash
# 安装依赖
pip install requests pdfplumber

# 运行下载脚本
cd docs/papers
python download_papers.py
```

脚本会自动：
1. 从 `LITERATURE_NEW_PONDER.md` 提取所有链接
2. 根据标题自动分类到 Tier 1 或 Tier 2
3. 下载 PDF 到对应文件夹
4. 转换为 TXT 格式（便于 AI 阅读）
5. 记录下载状态，避免重复下载

---

## 手动下载（如果脚本失败）

如果脚本无法下载，可以手动访问上述链接下载 PDF，然后：
1. 将 PDF 放到对应的文件夹（`tier1-required/` 或 `tier2-important/`）
2. 使用在线工具或 `pdfplumber` 转换为 TXT

---

**最后更新**: 2025-11-05  
**状态**: 待下载

