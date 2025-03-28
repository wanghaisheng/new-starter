#!/bin/bash

# Python虚拟环境设置脚本
# 该脚本创建并配置Python虚拟环境，安装项目所需的Python依赖

# 输出文件
RESULTS_FILE="docs/tasks/python-env-results.txt"

# 清空或创建结果文件
echo "Python虚拟环境设置结果报告" > $RESULTS_FILE
echo "=========================" >> $RESULTS_FILE
echo "执行时间: $(date)" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# 检查Python版本
echo "检查Python版本..." >> $RESULTS_FILE
PYTHON_VERSION=$(python3 --version 2>&1)
echo "Python版本: $PYTHON_VERSION" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# 检查是否安装了venv模块
echo "检查venv模块..." >> $RESULTS_FILE
if python3 -c "import venv" 2>/dev/null; then
  echo "✅ venv模块已安装" >> $RESULTS_FILE
else
  echo "❌ venv模块未安装，请安装Python3-venv" >> $RESULTS_FILE
  echo "在Ubuntu/Debian上: sudo apt-get install python3-venv" >> $RESULTS_FILE
  echo "在CentOS/RHEL上: sudo yum install python3-venv" >> $RESULTS_FILE
  echo "在macOS上: brew install python3" >> $RESULTS_FILE
  exit 1
fi
echo "" >> $RESULTS_FILE

# 检查是否安装了uv
echo "检查uv包管理器..." >> $RESULTS_FILE
if command -v uv &> /dev/null; then
  UV_VERSION=$(uv --version)
  echo "✅ uv已安装: $UV_VERSION" >> $RESULTS_FILE
  USE_UV=true
else
  echo "⚠️ uv未安装，将使用pip" >> $RESULTS_FILE
  USE_UV=false
fi
echo "" >> $RESULTS_FILE

# 创建虚拟环境
echo "创建虚拟环境..." >> $RESULTS_FILE
if [ -d "venv" ]; then
  echo "⚠️ 虚拟环境已存在，跳过创建" >> $RESULTS_FILE
else
  python3 -m venv venv
  if [ $? -eq 0 ]; then
    echo "✅ 虚拟环境创建成功" >> $RESULTS_FILE
  else
    echo "❌ 虚拟环境创建失败" >> $RESULTS_FILE
    exit 1
  fi
fi
echo "" >> $RESULTS_FILE

# 激活虚拟环境
echo "激活虚拟环境..." >> $RESULTS_FILE
source venv/bin/activate
if [ $? -eq 0 ]; then
  echo "✅ 虚拟环境激活成功" >> $RESULTS_FILE
else
  echo "❌ 虚拟环境激活失败" >> $RESULTS_FILE
  exit 1
fi
echo "" >> $RESULTS_FILE

# 创建requirements.txt文件
echo "创建requirements.txt文件..." >> $RESULTS_FILE
if [ ! -f "requirements.txt" ]; then
  cat > requirements.txt << 'EOL'
# 基础依赖
python-dotenv>=1.0.0
requests>=2.31.0

# 浏览器自动化
playwright>=1.42.0
DrissionPage>=4.0.0

# 搜索引擎
duckduckgo-search>=4.1.1

# HTML解析
html5lib>=1.1
beautifulsoup4>=4.12.2

# LLM API客户端
openai>=1.12.0
anthropic>=0.18.1
google-generativeai>=0.3.1

# 数据处理
pandas>=2.1.1
numpy>=1.26.0

# 图像处理
Pillow>=10.1.0
EOL
  echo "✅ requirements.txt文件创建成功" >> $RESULTS_FILE
else
  echo "⚠️ requirements.txt文件已存在，跳过创建" >> $RESULTS_FILE
fi
echo "" >> $RESULTS_FILE

# 安装依赖
echo "安装依赖..." >> $RESULTS_FILE
if [ "$USE_UV" = true ]; then
  echo "使用uv安装依赖..." >> $RESULTS_FILE
  uv pip install -r requirements.txt >> $RESULTS_FILE 2>&1
else
  echo "使用pip安装依赖..." >> $RESULTS_FILE
  pip install --upgrade pip >> $RESULTS_FILE 2>&1
  pip install -r requirements.txt >> $RESULTS_FILE 2>&1
fi

if [ $? -eq 0 ]; then
  echo "✅ 依赖安装成功" >> $RESULTS_FILE
else
  echo "❌ 依赖安装失败" >> $RESULTS_FILE
  exit 1
fi
echo "" >> $RESULTS_FILE

# 安装Playwright浏览器
echo "安装Playwright浏览器..." >> $RESULTS_FILE
playwright install chromium >> $RESULTS_FILE 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Playwright浏览器安装成功" >> $RESULTS_FILE
else
  echo "❌ Playwright浏览器安装失败" >> $RESULTS_FILE
  exit 1
fi
echo "" >> $RESULTS_FILE

# 创建.env.example文件
echo "创建.env.example文件..." >> $RESULTS_FILE
if [ ! -f ".env.example" ]; then
  cat > .env.example << 'EOL'
# OpenAI API配置
OPENAI_API_KEY=your_openai_api_key_here

# Azure OpenAI API配置
AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here
AZURE_OPENAI_MODEL_DEPLOYMENT=gpt-4o-ms

# Anthropic API配置
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Google API配置
GOOGLE_API_KEY=your_google_api_key_here

# DeepSeek API配置
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# SiliconFlow API配置
SILICONFLOW_API_KEY=your_siliconflow_api_key_here
EOL
  echo "✅ .env.example文件创建成功" >> $RESULTS_FILE
else
  echo "⚠️ .env.example文件已存在，跳过创建" >> $RESULTS_FILE
fi
echo "" >> $RESULTS_FILE

# 创建.env文件（如果不存在）
echo "创建.env文件..." >> $RESULTS_FILE
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "✅ .env文件创建成功（从.env.example复制）" >> $RESULTS_FILE
  echo "⚠️ 请编辑.env文件，填入您的API密钥" >> $RESULTS_FILE
else
  echo "⚠️ .env文件已存在，跳过创建" >> $RESULTS_FILE
fi
echo "" >> $RESULTS_FILE

# 创建Python环境设置结果
echo "" >> $RESULTS_FILE
echo "Python虚拟环境设置完成！" >> $RESULTS_FILE
echo "=========================" >> $RESULTS_FILE
echo "使用说明：" >> $RESULTS_FILE
echo "1. 激活虚拟环境: source venv/bin/activate" >> $RESULTS_FILE
echo "2. 运行截图工具: python tools/screenshot_utils.py URL --output OUTPUT" >> $RESULTS_FILE
echo "3. 运行搜索引擎: python tools/search_engine.py \"搜索关键词\"" >> $RESULTS_FILE
echo "4. 运行网页抓取: python tools/web_scraper.py URL1 URL2 --max-concurrent 3" >> $RESULTS_FILE
echo "5. 运行LLM API: python tools/llm_api.py --prompt \"您的问题\" --provider openai" >> $RESULTS_FILE
echo "6. 退出虚拟环境: deactivate" >> $RESULTS_FILE

# 输出到控制台
echo "✅ Python虚拟环境设置完成！请查看 $RESULTS_FILE 文件了解详细信息。"
echo "使用说明："
echo "1. 激活虚拟环境: source venv/bin/activate"
echo "2. 运行截图工具: python tools/screenshot_utils.py URL --output OUTPUT"
echo "3. 运行搜索引擎: python tools/search_engine.py \"搜索关键词\""
echo "4. 运行网页抓取: python tools/web_scraper.py URL1 URL2 --max-concurrent 3"
echo "5. 运行LLM API: python tools/llm_api.py --prompt \"您的问题\" --provider openai"
echo "6. 退出虚拟环境: deactivate" 