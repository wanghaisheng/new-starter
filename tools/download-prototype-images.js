/**
 * 下载原型中的图片资源脚本
 * 
 * 此脚本从prototype.html中提取所有图片URL，并下载到本地对应目录
 * - 用户头像图片保存到 public/assets/images/profiles/
 * - 背景图片保存到 public/assets/images/backgrounds/
 * - SVG图标保存到 src/assets/images/icons/
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { JSDOM } = require('jsdom');

// 配置目录
const PROTOTYPE_PATH = path.join(__dirname, '..', 'docs', 'product-research', 'prototype.html');
const PROFILES_DIR = path.join(__dirname, '..', 'public', 'assets', 'images', 'profiles');
const BACKGROUNDS_DIR = path.join(__dirname, '..', 'public', 'assets', 'images', 'backgrounds');
const ICONS_DIR = path.join(__dirname, '..', 'src', 'assets', 'images', 'icons');

// 确保目录存在
function ensureDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
    console.log(`创建目录: ${directory}`);
  }
}

// 从URL下载文件
async function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    // 检查文件是否已存在
    if (fs.existsSync(outputPath)) {
      console.log(`文件已存在，跳过下载: ${outputPath}`);
      return resolve();
    }
    
    // 选择http或https模块
    const client = url.startsWith('https') ? https : http;
    
    console.log(`下载: ${url} -> ${outputPath}`);
    
    const request = client.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // 处理重定向
        return downloadFile(response.headers.location, outputPath)
          .then(resolve)
          .catch(reject);
      }
      
      if (response.statusCode !== 200) {
        return reject(new Error(`下载失败，状态码: ${response.statusCode}`));
      }
      
      const fileStream = fs.createWriteStream(outputPath);
      response.pipe(fileStream);
      
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
    });
    
    request.on('error', (err) => {
      fs.unlink(outputPath, () => {}); // 删除可能部分下载的文件
      reject(err);
    });
  });
}

// 从SVG字符串创建SVG文件
function saveSvgFile(svgString, outputPath) {
  fs.writeFileSync(outputPath, svgString);
  console.log(`保存SVG: ${outputPath}`);
}

// 提取并处理图片
async function processImages() {
  try {
    // 确保目录存在
    ensureDirectoryExists(PROFILES_DIR);
    ensureDirectoryExists(BACKGROUNDS_DIR);
    ensureDirectoryExists(ICONS_DIR);
    
    // 读取原型文件
    const prototypeHtml = fs.readFileSync(PROTOTYPE_PATH, 'utf8');
    const dom = new JSDOM(prototypeHtml);
    const document = dom.window.document;
    
    // 处理所有图片
    const imgElements = document.querySelectorAll('img');
    console.log(`找到 ${imgElements.length} 个图片元素`);
    
    const downloadPromises = [];
    
    imgElements.forEach((img, index) => {
      const src = img.getAttribute('src');
      if (!src) return;
      
      let outputPath;
      let fileName;
      
      // 根据URL确定文件类型和保存位置
      if (src.includes('randomuser.me')) {
        // 用户头像
        const matches = src.match(/\/([^\/]+)\/([0-9]+)\.jpg$/);
        if (matches) {
          const gender = matches[1]; // women 或 men
          const id = matches[2];
          fileName = `profile-${gender}-${id}.jpg`;
          outputPath = path.join(PROFILES_DIR, fileName);
        }
      } else if (src.includes('unsplash.com')) {
        // 背景图片
        const photoId = src.split('/').pop();
        fileName = `background-${photoId}.jpg`;
        outputPath = path.join(BACKGROUNDS_DIR, fileName);
      } else if (src.startsWith('/')) {
        // 本地图片，可能是占位图
        fileName = path.basename(src);
        outputPath = path.join(PROFILES_DIR, fileName);
      } else {
        // 其他图片
        fileName = `image-${index}.jpg`;
        outputPath = path.join(BACKGROUNDS_DIR, fileName);
      }
      
      if (outputPath) {
        downloadPromises.push(downloadFile(src, outputPath));
      }
    });
    
    // 处理所有SVG图标
    const svgElements = document.querySelectorAll('svg');
    console.log(`找到 ${svgElements.length} 个SVG元素`);
    
    svgElements.forEach((svg, index) => {
      // 提取SVG的viewBox属性，用于生成文件名
      const viewBox = svg.getAttribute('viewBox') || '';
      const width = svg.getAttribute('width') || '';
      const height = svg.getAttribute('height') || '';
      
      // 尝试确定图标用途
      const parentElement = svg.parentElement;
      let iconPurpose = '';
      
      if (parentElement) {
        const parentText = parentElement.textContent.trim().toLowerCase();
        if (parentText.includes('home')) iconPurpose = 'home';
        else if (parentText.includes('profile')) iconPurpose = 'profile';
        else if (parentText.includes('message')) iconPurpose = 'message';
        else if (parentText.includes('settings')) iconPurpose = 'settings';
        else if (parentText.includes('search')) iconPurpose = 'search';
        else if (parentText.includes('notification')) iconPurpose = 'notification';
        else if (parentText.includes('like')) iconPurpose = 'like';
        else if (parentText.includes('dislike')) iconPurpose = 'dislike';
        else if (parentText.includes('photo')) iconPurpose = 'photo';
      }
      
      // 生成文件名
      const fileName = iconPurpose 
        ? `icon-${iconPurpose}.svg` 
        : `icon-${width}x${height}-${index}.svg`;
      
      const outputPath = path.join(ICONS_DIR, fileName);
      
      // 获取SVG的HTML字符串
      const svgString = svg.outerHTML;
      saveSvgFile(svgString, outputPath);
    });
    
    // 等待所有下载完成
    await Promise.all(downloadPromises);
    
    console.log('所有图片资源下载完成！');
  } catch (error) {
    console.error('处理图片时出错:', error);
  }
}

// 执行脚本
processImages().then(() => {
  console.log('图片资源下载脚本执行完成');
});