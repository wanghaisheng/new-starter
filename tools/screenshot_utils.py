"""
截图工具模块
提供捕获网页截图的功能
"""

import os
import asyncio
import argparse
from playwright.async_api import async_playwright

from get_browser import get_browser_sync

async def take_screenshot_async(url, output_path):
    """
    异步捕获网页截图
    
    参数:
        url (str): 要截图的网页URL
        output_path (str): 截图保存路径
        
    返回:
        str: 截图保存路径
    """
    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(headless=True)
    
    try:
        page = await browser.new_page()
        await page.goto(url, wait_until="networkidle")
        
        # 确保输出目录存在
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        
        # 捕获截图
        await page.screenshot(path=output_path, full_page=True)
        print(f"截图已保存到: {output_path}")
        
        return output_path
    finally:
        await browser.close()
        await playwright.stop()

def take_screenshot_sync(url, output_path):
    """
    同步捕获网页截图
    
    参数:
        url (str): 要截图的网页URL
        output_path (str): 截图保存路径
        
    返回:
        str: 截图保存路径
    """
    return asyncio.run(take_screenshot_async(url, output_path))

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="捕获网页截图")
    parser.add_argument("url", help="要截图的网页URL")
    parser.add_argument("--output", "-o", default="screenshot.png", help="截图保存路径")
    
    args = parser.parse_args()
    take_screenshot_sync(args.url, args.output)
