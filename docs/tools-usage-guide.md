# 项目工具使用指南

本文档提供了项目中各种工具的使用说明，帮助开发者提高开发效率。

## 目录

1. [环境设置](#环境设置)
2. [截图验证工具](#截图验证工具)
3. [LLM API工具](#llm-api工具)
4. [网页抓取工具](#网页抓取工具)
5. [搜索引擎工具](#搜索引擎工具)
6. [常见问题](#常见问题)

## 环境设置

在使用工具之前，需要先设置Python虚拟环境：

```bash
# 设置Python虚拟环境
bash docs/tasks/setup-python-env.sh

# 激活虚拟环境
source venv/bin/activate
```

## 截图验证工具

截图验证工具用于捕获网页截图并使用LLM验证其外观。

### 基本用法

```bash
# 捕获网页截图
python tools/screenshot_utils.py https://example.com --output screenshot.png

# 使用LLM验证截图
python tools/llm_api.py --prompt "这个网页的背景颜色是什么？标题是什么？" --provider openai --image screenshot.png
```

### 在Python代码中使用

```python
from tools.screenshot_utils import take_screenshot_sync
from tools.llm_api import query_llm

# 捕获截图
screenshot_path = take_screenshot_sync('https://example.com', 'screenshot.png')

# 使用LLM验证
response = query_llm(
    "这个网页的背景颜色是什么？标题是什么？",
    provider="openai",  # 或 "anthropic"
    image_path=screenshot_path
)
print(response)
```

## LLM API工具

LLM API工具用于调用各种大型语言模型。

### 支持的提供商

- OpenAI (默认，模型: gpt-4o)
- Azure OpenAI (模型: 通过.env文件中的AZURE_OPENAI_MODEL_DEPLOYMENT配置，默认为gpt-4o-ms)
- DeepSeek (模型: deepseek-chat)
- Anthropic (模型: claude-3-sonnet-20240229)
- Gemini (模型: gemini-pro)
- 本地LLM (模型: Qwen/Qwen2.5-32B-Instruct-AWQ)

### 基本用法

```bash
# 使用OpenAI
python tools/llm_api.py --prompt "什么是Next.js？" --provider openai

# 使用Anthropic
python tools/llm_api.py --prompt "什么是Capacitor？" --provider anthropic

# 使用带图像的查询
python tools/llm_api.py --prompt "描述这张图片" --provider openai --image path/to/image.png
```

### 在Python代码中使用

```python
from tools.llm_api import query_llm

# 简单文本查询
response = query_llm("什么是Ionic框架？", provider="openai")
print(response)

# 带图像的查询
response = query_llm(
    "描述这张图片",
    provider="openai",
    image_path="path/to/image.png"
)
print(response)
```

## 网页抓取工具

网页抓取工具用于获取网页内容。

### 基本用法

```bash
# 抓取单个网页
python tools/web_scraper.py https://example.com

# 抓取多个网页
python tools/web_scraper.py https://example.com https://example.org --max-concurrent 3
```

## 搜索引擎工具

搜索引擎工具用于搜索网页。

### 基本用法

```bash
# 搜索关键词
python tools/search_engine.py "Next.js Capacitor 教程"

# 限制结果数量
python tools/search_engine.py "Ionic Tailwind 示例" --max-results 5
```

### 输出格式

```
URL: https://example.com
Title: 搜索结果的标题
Snippet: 搜索结果的摘要
```

## 常见问题

### API密钥配置

所有API密钥应该配置在`.env`文件中。您可以复制`.env.example`文件并重命名为`.env`，然后填入您的API密钥。

### 虚拟环境问题

如果遇到虚拟环境问题，可以尝试重新创建：

```bash
rm -rf venv
bash docs/tasks/setup-python-env.sh
```

### Playwright浏览器问题

如果遇到Playwright浏览器问题，可以尝试手动安装：

```bash
playwright install chromium
``` 